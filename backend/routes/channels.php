<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Energy data channel - public channel for simulation
Broadcast::channel('energy.{userId}', function ($user, $userId) {
    // For now, allow access if logged in user matches, or allow all for testing
    return true;
});
