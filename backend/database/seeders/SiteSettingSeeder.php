<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'site_name'          => 'MatriConnect',
            'site_slogan'        => 'Find Your Perfect Life Partner',
            'site_logo'          => null,
            'site_favicon'       => null,
            'currency'           => 'BDT',
            'currency_symbol'    => '৳',
            'contact_email'      => 'demo@example.com',
            'contact_phone'      => '+880 1000-000000',
            'contact_address'    => 'Demo City, Bangladesh',
            'facebook_url'       => '#',
            'twitter_url'        => '#',
            'instagram_url'      => '#',
            'linkedin_url'       => '#',
            'meta_title'         => 'MatriConnect — Find Your Perfect Life Partner',
            'meta_description'   => 'Find your perfect life partner on MatriConnect — a trusted matrimony platform.',
            'meta_keywords'      => 'matrimony, marriage, bride, groom, matchmaking, Bangladesh',
            'face_scan_enabled'  => false,
            'email_verification_enabled' => false,
            'photo_auto_approval_enabled' => true,
            'minimum_match_score'  => 80,
        ];

        foreach ($defaults as $key => $value) {
            SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}

