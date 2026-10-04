<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;

class TrustedProxies extends TrustProxies
{
    protected function setTrustedProxyIpAddresses(Request $request)
    {
        // Read config during request handling, after bootstrap; no wildcard inference.
        $proxies = config('operations.trusted_proxies', []);
        abort_if(in_array('*', $proxies, true) || in_array('**', $proxies, true), 503, 'Proxy allowlist harus eksplisit.');
        $request->setTrustedProxies($proxies, Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO);
    }
}
