<?php

namespace App\Services;

use App\Jobs\ProcessPropertyMedia;
use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\PropertyMedia;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\Worker;
use Illuminate\Queue\WorkerOptions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MediaOperations
{
    public function scoped(User $actor, int $id, bool $lock = false): Property
    {
        $current = $actor->fresh();
        abort_unless($current?->is_active && in_array($current->role, ['ADMIN', 'MARKETING'], true), 403);
        $query = Property::query()->whereKey($id);
        if ($current->role !== 'ADMIN') {
            $query->where('owner_id', $current->id);
        }
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    public function create(User $actor, int $propertyId, array $data, ?UploadedFile $file): array
    {
        $this->scoped($actor, $propertyId);
        $path = null;
        if (in_array($data['kind'], ['VIDEO', 'TOUR'], true)) {
            $data['url'] = $this->embedUrl($data['kind'], $data['url']);
        } else {
            $this->validateFile($data['kind'], $file);
            $path = 'staging/'.Str::uuid().'.bin';
            try {
                Storage::disk('media')->put($path, file_get_contents($file->getRealPath()));
            } catch (\Throwable $exception) {
                Storage::disk('media')->delete($path);
                throw $exception;
            }
        }
        try {
            $result = DB::transaction(function () use ($actor, $propertyId, $data, $file, $path) {
                $property = $this->scoped($actor, $propertyId, true);
                $limit = match ($data['kind']) {
                    'PHOTO' => 20, 'FLOOR_PLAN' => 5, default => 1
                };
                abort_if($property->media()->where('kind', $data['kind'])->where('state', '!=', 'ARCHIVED')->count() >= $limit, 409, 'Batas media jenis ini tercapai. Arsipkan media lama terlebih dahulu.');
                $this->bump($property, $data['version']);
                $media = $property->media()->create(['kind' => $data['kind'], 'alt' => $data['alt'], 'state' => $path ? 'PROCESSING' : 'READY', 'staging_path' => $path, 'url' => $data['url'] ?? null, 'position' => $property->media()->max('position') + 1, 'mime' => $file?->getMimeType(), 'size_bytes' => $file?->getSize()]);
                $this->audit($actor, $property, $media, 'MEDIA_ADDED');
                if ($path) {
                    $this->enqueue($media);
                }

                return ['data' => $media, 'property_version' => $property->version];
            }, 3);
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk('media')->delete($path);
            }
            throw $exception;
        }
        if ($path) {
            $this->processNextJob();
            $result['data']->refresh();
        }

        return $result;
    }

    public function update(User $actor, int $propertyId, int $id, array $data): array
    {
        $result = DB::transaction(function () use ($actor, $propertyId, $id, $data) {
            $property = $this->scoped($actor, $propertyId, true);
            $media = $property->media()->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_if($media->state === 'ARCHIVED', 409, 'Media telah diarsipkan.');
            $this->bump($property, $data['version']);
            $changes = array_intersect_key($data, array_flip(['alt', 'position', 'published']));
            if ($data['archived'] ?? false) {
                $changes = array_merge($changes, ['state' => 'ARCHIVED', 'published' => false, 'archived_at' => now()]);
            }
            if ($data['retry'] ?? false) {
                abort_unless($media->state === 'FAILED' && ! ($data['archived'] ?? false), 409, 'Hanya media gagal yang dapat diproses ulang.');
                $changes = array_merge($changes, ['state' => 'PROCESSING', 'failure_code' => null]);
            }
            $media->update($changes);
            $this->audit($actor, $property, $media, ($data['archived'] ?? false) ? 'MEDIA_ARCHIVED' : 'MEDIA_UPDATED');
            if ($data['retry'] ?? false) {
                $this->enqueue($media);
            }

            return ['data' => $media->refresh(), 'property_version' => $property->version];
        }, 3);
        if ($data['retry'] ?? false) {
            $this->processNextJob();
            $result['data']->refresh();
        }

        return $result;
    }

    public function processPending(User $actor, int $propertyId): void
    {
        $property = $this->scoped($actor, $propertyId);
        abort_unless(config('media.process_in_request'), 409, 'Pemrosesan menggunakan worker terpisah.');
        if ($property->media()->where('state', 'PROCESSING')->exists()) {
            $this->processNextJob();
        }
    }

    private function processNextJob(): void
    {
        if (! config('media.process_in_request')) {
            return;
        }
        // The durable job is committed before a bounded worker consumes it.
        // This also preserves retries when storage or processing is unavailable.
        /** @var Worker $worker */
        $worker = app('queue.worker');
        $worker->runNextJob('database', config('media.queue'), new WorkerOptions(
            name: 'media-request', backoff: 10, timeout: 45, sleep: 0, maxTries: 3,
        ));
    }

    private function bump(Property $property, int $version): void
    {
        $changed = Property::query()->whereKey($property->id)->where('version', $version)->update(['version' => DB::raw('version + 1'), 'updated_at' => now()]);
        abort_unless($changed === 1, 409, 'Data berubah. Muat ulang sebelum melanjutkan.');
        $property->refresh();
    }

    private function audit(User $actor, Property $property, PropertyMedia $media, string $action): void
    {
        ActivityLog::create(['actor_id' => $actor->id, 'subject_type' => 'PROPERTY', 'subject_id' => $property->id, 'action' => $action, 'changes' => ['media_id' => $media->id, 'kind' => $media->kind]]);
    }

    private function enqueue(PropertyMedia $media): void
    {
        // Same database transaction: workers cannot see this job before commit.
        abort_unless(config('queue.connections.database.connection') === null || config('queue.connections.database.connection') === config('database.default'), 503, 'Queue media harus memakai database aplikasi.');
        ProcessPropertyMedia::dispatch($media->id)->onConnection('database')->onQueue(config('media.queue'))->beforeCommit();
    }

    private function validateFile(string $kind, ?UploadedFile $file): void
    {
        $valid = $file && $file->isValid();
        if ($valid && $kind === 'BROCHURE') {
            $body = file_get_contents($file->getRealPath());
            $valid = $file->getSize() <= 10 * 1024 * 1024 && $file->getMimeType() === 'application/pdf' && str_starts_with($body, '%PDF-') && str_contains(substr($body, -1024), '%%EOF');
        } elseif ($valid) {
            $dimensions = @getimagesize($file->getRealPath());
            $valid = $file->getSize() <= 5 * 1024 * 1024 && $dimensions && in_array($dimensions[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true) && $dimensions['mime'] === $file->getMimeType() && $dimensions[0] > 0 && $dimensions[1] > 0 && $dimensions[0] <= 20000 && $dimensions[1] <= 20000 && $dimensions[0] * $dimensions[1] <= 40000000;
        }
        if (! $valid) {
            throw ValidationException::withMessages(['file' => 'Gunakan JPEG/PNG/WebP ≤5MiB/40MP atau PDF brosur ≤10MiB yang valid.']);
        }
    }

    private function embedUrl(string $kind, string $url): string
    {
        $parts = parse_url($url);
        $valid = $parts && ($parts['scheme'] ?? '') === 'https' && ! isset($parts['user']) && ! isset($parts['pass']) && (! isset($parts['port']) || $parts['port'] === 443);
        $host = strtolower($parts['host'] ?? '');
        if ($valid && $kind === 'VIDEO') {
            parse_str($parts['query'] ?? '', $query);
            $id = $host === 'youtu.be' ? trim($parts['path'] ?? '', '/') : ($query['v'] ?? '');
            if (in_array($host, ['youtu.be', 'youtube.com', 'www.youtube.com', 'm.youtube.com'], true) && is_string($id) && preg_match('/^[a-zA-Z0-9_-]{11}$/', $id)) {
                return 'https://www.youtube-nocookie.com/embed/'.$id;
            }
        } elseif ($valid && in_array($host, config('media.tour_hosts'), true)) {
            return $url;
        }
        throw ValidationException::withMessages(['url' => 'Gunakan HTTPS YouTube atau provider tour yang disetujui.']);
    }
}
