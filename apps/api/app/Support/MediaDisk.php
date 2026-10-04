<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Resolves the private media disk.
 *
 * Local disks expose a filesystem path, so responses and scanners can use the
 * stored file directly. Remote disks (S3-compatible R2/Object Storage) do not,
 * so the object is copied into a temporary file for the duration of the work.
 */
class MediaDisk
{
    public static function disk(): Filesystem
    {
        return app('filesystem')->disk('media');
    }

    public static function isLocal(): bool
    {
        return config('filesystems.disks.media.driver') === 'local';
    }

    /**
     * Materialise a stored object as a readable local path.
     *
     * @return array{path: string, temporary: bool}
     */
    public static function localPath(string $path): array
    {
        $disk = self::disk();

        if (self::isLocal()) {
            return ['path' => $disk->path($path), 'temporary' => false];
        }

        $temporary = tempnam(sys_get_temp_dir(), 'flamboyan-media-');
        abort_if($temporary === false, 503, 'Penyimpanan sementara tidak tersedia.');

        try {
            $stream = $disk->readStream($path);
        } catch (\Throwable) {
            @unlink($temporary);
            abort(404);
        }

        if (! is_resource($stream)) {
            @unlink($temporary);
            abort(404);
        }

        $target = @fopen($temporary, 'wb');
        if ($target === false) {
            fclose($stream);
            @unlink($temporary);
            abort(503, 'Penyimpanan sementara tidak tersedia.');
        }

        try {
            stream_copy_to_stream($stream, $target);
        } finally {
            fclose($stream);
            fclose($target);
        }

        return ['path' => $temporary, 'temporary' => true];
    }

    /**
     * Run a callback against a local copy and always clean the copy up.
     */
    public static function withLocalPath(string $path, callable $callback): mixed
    {
        $local = self::localPath($path);

        try {
            return $callback($local['path']);
        } finally {
            if ($local['temporary']) {
                @unlink($local['path']);
            }
        }
    }

    public static function fileResponse(string $path, array $headers = []): BinaryFileResponse
    {
        return self::disposable(response()->file(self::localPath($path)['path'], $headers), $path);
    }

    public static function downloadResponse(string $path, string $name, array $headers = []): BinaryFileResponse
    {
        return self::disposable(response()->download(self::localPath($path)['path'], $name, $headers), $path);
    }

    /**
     * Temporary copies must survive until the response has been sent. Paths that
     * live on the private disk itself must never be deleted after sending.
     */
    private static function disposable(BinaryFileResponse $response, string $path): BinaryFileResponse
    {
        return self::isLocal()
            ? $response
            : $response->deleteFileAfterSend(true);
    }
}
