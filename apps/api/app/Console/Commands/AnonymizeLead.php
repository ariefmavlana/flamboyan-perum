<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\User;
use App\Services\LeadPrivacy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class AnonymizeLead extends Command
{
    protected $signature = 'flamboyan:lead-anonymize {id} {--execute} {--actor=} {--lead-version=} {--request=} {--retention}';

    protected $description = 'Dry-run lead redaction; execution requires approved policy, Admin password and explicit confirmation';

    public function handle(LeadPrivacy $privacy): int
    {
        if (! ctype_digit((string) $this->argument('id'))) {
            $this->error('ID tidak valid.');

            return self::FAILURE;
        }
        $lead = Lead::find($this->argument('id'));
        if (! $lead) {
            $this->error('Lead tidak tersedia.');

            return self::FAILURE;
        }
        $this->info('Lead #'.$lead->id.' · version '.$lead->version.' · '.$lead->status.' · '.($lead->anonymized_at ? 'already anonymized' : 'not anonymized'));
        if (! $this->option('execute')) {
            $this->info('Dry-run: tidak ada data yang diubah.');

            return self::SUCCESS;
        }
        $actor = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower((string) $this->option('actor'))])->first();
        if (! $actor?->is_active || $actor->role !== 'ADMIN' || ! Hash::check((string) $this->secret('Kata sandi Admin'), $actor->password)) {
            $this->error('Identitas Admin tidak valid.');

            return self::FAILURE;
        }
        if (! ctype_digit((string) $this->option('lead-version')) || (int) $this->option('lead-version') < 1 || ! $this->option('request')) {
            $this->error('Version dan referensi kasus wajib.');

            return self::FAILURE;
        }
        if ($this->ask('Ketik ANONYMIZE '.$lead->id.' untuk konfirmasi redaksi permanen') !== 'ANONYMIZE '.$lead->id) {
            $this->error('Konfirmasi tidak sesuai.');

            return self::FAILURE;
        }
        try {
            $privacy->anonymize($actor, $lead->id, (int) $this->option('lead-version'), (string) $this->option('request'), (bool) $this->option('retention'));
        } catch (\Throwable) {
            $this->error('Redaksi gagal. Periksa policy, akses, terminal/retensi/versi dan kesehatan database; tidak ada perubahan parsial.');

            return self::FAILURE;
        }
        $this->info('Kontak/catatan dianonimkan; histori, aktor dan metrik dipertahankan.');

        return self::SUCCESS;
    }
}
