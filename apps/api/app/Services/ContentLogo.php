<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ContentLogo
{
    public function upload(User $actor, int $id, int $version, UploadedFile $file): SiteContent
    {
        abort_unless($actor->is_active && $actor->role === 'ADMIN', 403);
        $record = SiteContent::query()->whereKey($id)->where('kind', 'BANK_PARTNER')->firstOrFail();
        abort_unless($record->version === $version, 409, 'Konten berubah. Muat ulang dan tinjau kembali.');
        $dimensions = @getimagesize($file->getRealPath());
        if (! $file->isValid() || $file->getSize() > 2 * 1024 * 1024 || ! $dimensions || ! in_array($dimensions[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true) || $dimensions['mime'] !== $file->getMimeType() || $dimensions[0] < 1 || $dimensions[1] < 1 || $dimensions[0] > 4000 || $dimensions[1] > 4000 || $dimensions[0] * $dimensions[1] > 4000000) {
            throw ValidationException::withMessages(['file' => 'Gunakan logo JPEG/PNG/WebP valid, maksimal 2 MiB dan 4 megapiksel.']);
        }
        abort_unless(extension_loaded('gd') && function_exists('imagewebp'), 503, 'Pemroses gambar belum tersedia.');
        $image = @imagecreatefromstring(file_get_contents($file->getRealPath()));
        if (! $image) {
            throw ValidationException::withMessages(['file' => 'Gambar logo tidak dapat dibaca.']);
        }
        $scale = min(1, 640 / max(imagesx($image), imagesy($image)));
        $width = max(1, (int) round(imagesx($image) * $scale));
        $height = max(1, (int) round(imagesy($image) * $scale));
        $scaled = imagecreatetruecolor($width, $height);
        imagealphablending($scaled, false);
        imagesavealpha($scaled, true);
        imagecopyresampled($scaled, $image, 0, 0, 0, 0, $width, $height, imagesx($image), imagesy($image));
        ob_start();
        try {
            $encoded = imagewebp($scaled, null, 88);
            $bytes = ob_get_contents();
        } finally {
            ob_end_clean();
            unset($image, $scaled);
        }
        if (! $encoded || ! is_string($bytes) || $bytes === '') {
            throw new \RuntimeException('Logo encoding failed');
        }
        $path = 'content-logos/'.Str::uuid().'.webp';
        try {
            if (! Storage::disk('media')->put($path, $bytes)) {
                throw new \RuntimeException('Logo storage failed');
            }

            return DB::transaction(function () use ($actor, $id, $version, $path, $width, $height) {
                $currentActor = User::query()->whereKey($actor->id)->lockForUpdate()->first();
                abort_unless($currentActor?->is_active && $currentActor->role === 'ADMIN', 403);
                $record = SiteContent::query()->whereKey($id)->where('kind', 'BANK_PARTNER')->lockForUpdate()->firstOrFail();
                $payload = $record->payload;
                $payload['_logo'] = ['path' => $path, 'width' => $width, 'height' => $height];
                $changed = SiteContent::query()->whereKey($id)->where('version', $version)->update(['payload' => json_encode($payload, JSON_THROW_ON_ERROR), 'version' => DB::raw('version + 1'), 'updated_by' => $currentActor->id, 'verified_by' => $currentActor->id, 'verified_at' => now(), 'updated_at' => now()]);
                abort_unless($changed === 1, 409, 'Konten berubah. Muat ulang dan tinjau kembali.');
                ActivityLog::create(['actor_id' => $currentActor->id, 'subject_type' => 'CONTENT', 'subject_id' => $record->id, 'action' => 'LOGO_UPDATED', 'changes' => ['kind' => 'BANK_PARTNER']]);

                return $record->refresh();
            }, 3);
        } catch (\Throwable $exception) {
            Storage::disk('media')->delete($path);
            throw $exception;
        }
    }
}
