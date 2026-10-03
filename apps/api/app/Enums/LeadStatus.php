<?php

namespace App\Enums;

enum LeadStatus: string
{
    case NewLead = 'NEW_LEAD';
    case FollowedUp = 'FOLLOWED_UP';
    case Survey = 'SURVEY_LOKASI';
    case Documentation = 'PEMBERKASAN_KPR';
    case Deal = 'DEAL';
    case Lost = 'LOST';

    public function isTerminal(): bool
    {
        return $this === self::Deal || $this === self::Lost;
    }

    public function canTransitionTo(self $target): bool
    {
        if ($this->isTerminal()) {
            return false;
        }
        if ($target === self::Lost) {
            return true;
        }

        return match ($this) {
            self::NewLead => $target === self::FollowedUp,
            self::FollowedUp => $target === self::Survey,
            self::Survey => $target === self::Documentation,
            self::Documentation => $target === self::Deal,
            default => false,
        };
    }
}
