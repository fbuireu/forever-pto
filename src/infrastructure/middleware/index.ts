import { detectLocation } from "@infrastructure/services/location/detectLocation";
import type { NextRequest, NextResponse } from "next/server";

interface MiddlewareParams{
    request: NextRequest;
    response: NextResponse;
}

export async function middleware({request, response}: MiddlewareParams): Promise<NextResponse> {
    const userLocation = await detectLocation(request);
    const locationCookie = request.cookies.get('location')?.value;
    
    if (userLocation && userLocation !== locationCookie) {
        response.cookies.set('location', userLocation, {
            httpOnly: true,  
            secure: true,   
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });
    }
    
    return response;
}