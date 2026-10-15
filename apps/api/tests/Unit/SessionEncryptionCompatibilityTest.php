<?php

namespace Tests\Unit;

use Illuminate\Encryption\Encrypter;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\EncryptedStore;
use Illuminate\Session\Store;
use PHPUnit\Framework\TestCase;

class SessionEncryptionCompatibilityTest extends TestCase
{
    public function test_switching_session_encryption_invalidates_old_authentication_safely(): void
    {
        $handler = new ArraySessionHandler(120);
        $legacy = new Store('fixture', $handler);
        $legacy->start();
        $legacy->put('login_fixture_id', 42);
        $legacy->save();
        $encrypter = new Encrypter(random_bytes(32), 'AES-256-CBC');
        $encrypted = new EncryptedStore('fixture', $handler, $encrypter, $legacy->getId());
        $encrypted->start();
        $this->assertNull($encrypted->get('login_fixture_id'));
        $encrypted->put('login_fixture_id', 43);
        $encrypted->save();
        $samePolicy = new EncryptedStore('fixture', $handler, $encrypter, $encrypted->getId());
        $samePolicy->start();
        $this->assertSame(43, $samePolicy->get('login_fixture_id'));
        $rollback = new Store('fixture', $handler, $encrypted->getId());
        $rollback->start();
        $this->assertNull($rollback->get('login_fixture_id'));
    }
}
