<?php

namespace App\Services;

use App\Models\PropertyMedia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaProcessor
{
    public function __construct(private MalwareScanner $scanner) {}

    public function process(int $id): void
    {
        $media = PropertyMedia::find($id);
        if (! $media || $media->state !== 'PROCESSING') {
            return;
        }
        $disk = Storage::disk('media');
        if (! $media->staging_path || ! $disk->exists($media->staging_path)) {
            $this->reject($id, 'SOURCE_MISSING');

            return;
        }
        $directory = 'ready/'.Str::uuid();
        $variants = [];
        if ($media->kind === 'BROCHURE') {
            $verdict = $this->scanner->inspect($disk->path($media->staging_path));
            if ($verdict !== 'CLEAN') {
                $this->reject($id, $verdict);

                return;
            }
            $path = $directory.'/brochure.pdf';
            $disk->copy($media->staging_path, $path);
            $variants['download'] = ['path' => $path, 'mime' => 'application/pdf'];
        } else {
            if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
                $this->reject($id, 'IMAGE_PROCESSOR_UNAVAILABLE');

                return;
            }
            $image = @imagecreatefromstring($disk->get($media->staging_path));
            if (! $image) {
                $this->reject($id, 'INVALID_IMAGE');

                return;
            }
            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);
            try {
                foreach ([640, 1280, 1920] as $size) {
                    $width = min($size, $originalWidth);
                    $height = max(1, (int) round($originalHeight * $width / $originalWidth));
                    $scaled = imagecreatetruecolor($width, $height);
                    imagealphablending($scaled, false);
                    imagesavealpha($scaled, true);
                    imagecopyresampled($scaled, $image, 0, 0, 0, 0, $width, $height, $originalWidth, $originalHeight);
                    ob_start();
                    try {
                        $encoded = imagewebp($scaled, null, 82);
                        $content = ob_get_contents();
                    } finally {
                        ob_end_clean();
                        unset($scaled);
                    }
                    if (! $encoded || ! is_string($content) || $content === '') {
                        throw new \RuntimeException('Image encoding failed');
                    }
                    $path = $directory.'/'.$size.'.webp';
                    $disk->put($path, $content);
                    $variants[(string) $size] = ['path' => $path, 'mime' => 'image/webp', 'width' => $width, 'height' => $height];
                }
            } catch (\Throwable $exception) {
                $disk->deleteDirectory($directory);
                throw $exception;
            } finally {
                unset($image);
            }
        }
        try {
            $accepted = DB::transaction(function () use ($id, $variants, $media) {
                $current = PropertyMedia::query()->whereKey($id)->lockForUpdate()->first();
                if (! $current || $current->state !== 'PROCESSING') {
                    return false;
                }

                return PropertyMedia::query()->whereKey($id)->where('state', 'PROCESSING')->update(['state' => 'READY', 'variants' => json_encode($variants, JSON_THROW_ON_ERROR), 'mime' => $media->kind === 'BROCHURE' ? 'application/pdf' : 'image/webp', 'width' => $variants['1920']['width'] ?? null, 'height' => $variants['1920']['height'] ?? null, 'failure_code' => null, 'updated_at' => now()]) === 1;
            }, 3);
        } catch (\Throwable $exception) {
            $disk->deleteDirectory($directory);
            throw $exception;
        }
        if (! $accepted) {
            $disk->deleteDirectory($directory);
        }
    }

    private function reject(int $id, string $code): void
    {
        PropertyMedia::query()->whereKey($id)->where('state', 'PROCESSING')->update(['state' => 'FAILED', 'failure_code' => $code, 'updated_at' => now()]);
    }
}
