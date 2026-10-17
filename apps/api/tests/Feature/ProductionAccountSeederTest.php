<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\ProductionAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ProductionAccountSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_opt_in_seeder_creates_only_two_active_accounts_and_does_not_reset_existing_passwords(): void
    {
        $this->seed();
        $this->assertDatabaseCount('users', 0);
        config(['provisioning.admin_password' => 'Test-admin-secret-123', 'provisioning.marketing_password' => 'Test-marketing-secret-123']);
        $this->seed(ProductionAccountSeeder::class);
        $admin = User::where('email', 'andre@admin.com')->firstOrFail();
        $marketing = User::where('email', 'marketing1@arief.com')->firstOrFail();
        $this->assertTrue(Hash::check('Test-admin-secret-123', $admin->password));
        $this->assertTrue(Hash::check('Test-marketing-secret-123', $marketing->password));
        $this->assertSame('ADMIN', $admin->role);
        $this->assertSame('MARKETING', $marketing->role);
        $this->assertTrue($admin->is_active && $marketing->is_active);
        $this->postJson('/auth/login', ['email' => $admin->email, 'password' => 'Test-admin-secret-123'])->assertOk()->assertJsonPath('data.role', 'ADMIN');
        $this->postJson('/auth/logout')->assertNoContent();
        $this->postJson('/auth/login', ['email' => $marketing->email, 'password' => 'Test-marketing-secret-123'])->assertOk()->assertJsonPath('data.role', 'MARKETING');
        $this->getJson('/api/v1/internal/users')->assertForbidden();
        config(['provisioning.admin_password' => 'Changed-test-secret-123']);
        $this->seed(ProductionAccountSeeder::class);
        $this->assertSame($admin->password, $admin->fresh()->password);
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('properties', 0);
        $this->assertDatabaseCount('leads', 0);
    }

    public function test_missing_secret_prevents_partial_creation(): void
    {
        config(['provisioning.admin_password' => 'Test-admin-secret-123', 'provisioning.marketing_password' => null]);
        try {
            $this->seed(ProductionAccountSeeder::class);
            $this->fail('Missing password must fail');
        } catch (ValidationException) {
            $this->assertDatabaseCount('users', 0);
        }
    }

    public function test_existing_administrator_blocks_bootstrap_without_partial_accounts(): void
    {
        config(['provisioning.admin_password' => 'Test-admin-secret-123', 'provisioning.marketing_password' => 'Test-marketing-secret-123']);
        User::factory()->create(['email' => 'existing-admin@example.test', 'role' => 'ADMIN', 'is_active' => false]);
        try {
            $this->seed(ProductionAccountSeeder::class);
            $this->fail('Existing Administrator must block replacement bootstrap');
        } catch (ValidationException) {
            $this->assertDatabaseCount('users', 1);
            $this->assertDatabaseMissing('users', ['email' => 'andre@admin.com']);
            $this->assertDatabaseMissing('users', ['email' => 'marketing1@arief.com']);
        }
    }

    public function test_conflicting_role_rolls_back_all_accounts(): void
    {
        config(['provisioning.admin_password' => 'Test-admin-secret-123', 'provisioning.marketing_password' => 'Test-marketing-secret-123']);
        User::factory()->create(['email' => 'marketing1@arief.com', 'role' => 'ADMIN', 'is_active' => true]);
        try {
            $this->seed(ProductionAccountSeeder::class);
            $this->fail('Existing role must not be overwritten');
        } catch (ValidationException) {
            $this->assertDatabaseCount('users', 1);
            $this->assertDatabaseMissing('users', ['email' => 'andre@admin.com']);
        }
    }
}
