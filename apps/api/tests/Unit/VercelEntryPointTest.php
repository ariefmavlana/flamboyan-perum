<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Process\Process;

class VercelEntryPointTest extends TestCase
{
    public static function requests(): array
    {
        return [
            'API prefix' => ['/api/v1/vercel-route-probe?sort=price', '/api/v1/vercel-route-probe'],
            'auth prefix' => ['/auth/vercel-route-probe', '/auth/vercel-route-probe'],
            'media prefix' => ['/media/vercel-route-probe', '/media/vercel-route-probe'],
        ];
    }

    #[DataProvider('requests')]
    public function test_function_entry_preserves_the_application_path(string $uri, string $path): void
    {
        $entry = dirname(__DIR__, 2).'/api/index.php';
        $code = <<<'PHP'
        $_SERVER = array_merge($_SERVER, [
            'SCRIPT_FILENAME' => $argv[1],
            'SCRIPT_NAME' => '/api/index.php',
            'PHP_SELF' => '/api/index.php',
            'DOCUMENT_ROOT' => dirname($argv[1], 2),
            'REQUEST_METHOD' => 'GET',
            'REQUEST_URI' => $argv[2],
            'QUERY_STRING' => parse_url($argv[2], PHP_URL_QUERY) ?? '',
            'SERVER_PROTOCOL' => 'HTTP/1.1',
            'HTTP_HOST' => 'demo.example.test',
            'HTTP_ACCEPT' => 'application/json',
        ]);
        ob_start();
        require $argv[1];
        ob_end_clean();
        $request = Illuminate\Http\Request::capture();
        echo json_encode(['path' => $request->getPathInfo(), 'base' => $request->getBaseUrl()]);
        PHP;
        $process = new Process([PHP_BINARY, '-r', $code, $entry, $uri], dirname(__DIR__, 2), [
            'APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'DB_CONNECTION' => 'sqlite',
            'DB_DATABASE' => ':memory:', 'DB_URL' => '', 'CACHE_STORE' => 'array',
            'SESSION_DRIVER' => 'array', 'LOG_CHANNEL' => 'null',
        ]);
        $process->mustRun();
        $result = json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame($path, $result['path']);
        $this->assertSame('', $result['base']);
    }
}
