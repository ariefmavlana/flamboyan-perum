<?php

// Local isolated evidence only; not a production backup/restore automation.
require __DIR__.'/../../vendor/autoload.php';
$workspace = realpath(__DIR__.'/../../../..');
$root = $workspace.'/.tools/backup-drill-'.bin2hex(random_bytes(8));
if (! extension_loaded('sodium') || ! extension_loaded('sqlite3')) {
    throw new RuntimeException('Native sodium and SQLite3 are required for this local drill.');
}
mkdir($root, 0700);
$key = sodium_crypto_secretstream_xchacha20poly1305_keygen();
$started = hrtime(true);
$source = new SQLite3($workspace.'/.tools/acceptance-load.sqlite', SQLITE3_OPEN_READONLY);
$snapshot = new SQLite3($root.'/snapshot.sqlite');
if (! $source->backup($snapshot)) {
    throw new RuntimeException('Consistent snapshot failed.');
}
$source->close();
$snapshot->close();
copy($workspace.'/.tools/browser-photo.jpg', $root.'/media-fixture.jpg');
$manifest = ['database_sha256' => hash_file('sha256', $root.'/snapshot.sqlite'), 'media_sha256' => hash_file('sha256', $root.'/media-fixture.jpg')];
file_put_contents($root.'/manifest.json', json_encode($manifest, JSON_THROW_ON_ERROR));
$archive = new PharData($root.'/snapshot.tar');
foreach (['snapshot.sqlite', 'media-fixture.jpg', 'manifest.json'] as $name) {
    $archive->addFile($root.'/'.$name, $name);
}
unset($archive);

function encryptDrill(string $source, string $target, #[SensitiveParameter] string $key): void
{
    [$state, $header] = sodium_crypto_secretstream_xchacha20poly1305_init_push($key);
    $input = fopen($source, 'rb');
    $output = fopen($target, 'xb');
    fwrite($output, 'FLBKP1'.$header);
    try {
        do {
            $plain = fread($input, 1048576);
            if ($plain === false) {
                throw new RuntimeException('Read failed.');
            }
            $final = $plain === '' && feof($input);
            $cipher = sodium_crypto_secretstream_xchacha20poly1305_push($state, $plain, '', $final ? SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL : SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE);
            $frame = pack('N', strlen($cipher)).$cipher;
            if (fwrite($output, $frame) !== strlen($frame)) {
                throw new RuntimeException('Write failed.');
            }
        } while (! $final);
    } finally {
        fclose($input);
        fclose($output);
        sodium_memzero($state);
    }
}

function decryptDrill(string $source, string $target, #[SensitiveParameter] string $key): void
{
    $input = fopen($source, 'rb');
    $output = fopen($target, 'xb');
    $finished = false;
    try {
        if (fread($input, 6) !== 'FLBKP1') {
            throw new RuntimeException('Wrong format.');
        }
        $header = fread($input, SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_HEADERBYTES);
        $state = sodium_crypto_secretstream_xchacha20poly1305_init_pull($header, $key);
        while (! feof($input)) {
            $length = fread($input, 4);
            if (strlen($length) !== 4) {
                throw new RuntimeException('Missing authenticated final frame.');
            }
            $size = unpack('N', $length)[1];
            if ($size < 17 || $size > 1048593) {
                throw new RuntimeException('Invalid frame bound.');
            }
            $cipher = '';
            while (strlen($cipher) < $size && ! feof($input)) {
                $cipher .= fread($input, $size - strlen($cipher));
            }
            $result = sodium_crypto_secretstream_xchacha20poly1305_pull($state, $cipher);
            if ($result === false) {
                throw new RuntimeException('Authenticated decryption failed.');
            }
            [$plain, $tag] = $result;
            if (fwrite($output, $plain) !== strlen($plain)) {
                throw new RuntimeException('Write failed.');
            }
            if ($tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL) {
                if (fread($input, 1) !== '') {
                    throw new RuntimeException('Trailing data.');
                }
                $finished = true;
                break;
            }
        }
        if (! $finished) {
            throw new RuntimeException('Truncated encrypted archive.');
        }
    } finally {
        fclose($input);
        fclose($output);
        if (isset($state)) {
            sodium_memzero($state);
        } if (! $finished) {
            unlink($target);
        }
    }
}

encryptDrill($root.'/snapshot.tar', $root.'/backup.flb', $key);
decryptDrill($root.'/backup.flb', $root.'/restored.tar', $key);
if (hash_file('sha256', $root.'/snapshot.tar') !== hash_file('sha256', $root.'/restored.tar')) {
    throw new RuntimeException('Archive checksum mismatch.');
}
$restoredArchive = new PharData($root.'/restored.tar');
mkdir($root.'/restored', 0700);
$restoredArchive->extractTo($root.'/restored', ['snapshot.sqlite', 'media-fixture.jpg', 'manifest.json'], false);
if (hash_file('sha256', $root.'/restored/snapshot.sqlite') !== $manifest['database_sha256'] || hash_file('sha256', $root.'/restored/media-fixture.jpg') !== $manifest['media_sha256']) {
    throw new RuntimeException('Database/media checksum mismatch.');
}
$restored = new SQLite3($root.'/restored/snapshot.sqlite', SQLITE3_OPEN_READONLY);
$properties = (int) $restored->querySingle('SELECT COUNT(*) FROM properties');
$leads = (int) $restored->querySingle('SELECT COUNT(*) FROM leads');
$foreignKeys = $restored->query('PRAGMA foreign_key_check');
if ($properties !== 10000 || $leads !== 50000 || $foreignKeys->fetchArray()) {
    throw new RuntimeException('Restored counts/FKs do not match.');
}
$integrity = $restored->querySingle('PRAGMA integrity_check');
if ($integrity !== 'ok') {
    throw new RuntimeException('Integrity check failed.');
}
$restored->close();
$tampered = file_get_contents($root.'/backup.flb');
$tampered[100] = chr(ord($tampered[100]) ^ 1);
file_put_contents($root.'/tampered.flb', $tampered);
unset($tampered);
$rejected = false;
try {
    decryptDrill($root.'/tampered.flb', $root.'/tampered.tar', $key);
} catch (RuntimeException) {
    $rejected = true;
}
if (! $rejected || file_exists($root.'/tampered.tar')) {
    throw new RuntimeException('Tampered archive must be rejected and partial output removed.');
}
sodium_memzero($key);
echo json_encode(['database' => 'SQLite native consistent backup API', 'encryption' => 'native sodium authenticated secretstream / 1MiB chunks', 'properties' => $properties, 'leads' => $leads, 'database_media_checksum' => 'passed', 'integrity' => $integrity, 'foreign_keys' => 'passed', 'tamper_rejected' => true, 'elapsed_seconds' => round((hrtime(true) - $started) / 1000000000, 3), 'limitation' => 'Synthetic local fixture. No production restore or offsite/RPO/retention validation. Ephemeral key destroyed; private drill copies require controlled cleanup.'], JSON_THROW_ON_ERROR).PHP_EOL;
