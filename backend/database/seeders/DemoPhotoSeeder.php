<?php

namespace Database\Seeders;

use App\Models\ProfilePhoto;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoPhotoSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $avatarCount = 8;

        foreach ($users as $index => $user) {
            $avatarIndex = ($index % $avatarCount) + 1;

            ProfilePhoto::updateOrCreate(
                ['user_id' => $user->id, 'is_primary' => true],
                [
                    'file_path' => "/avatars/avatar-{$avatarIndex}.svg",
                    'is_primary' => true,
                    'is_approved' => true,
                    'is_private' => false,
                    'moderation_status' => 'approved',
                ]
            );
        }

        $this->command->info('✅ Demo avatar photos attached to seeded users.');
    }
}
