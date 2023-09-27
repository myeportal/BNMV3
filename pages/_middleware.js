import { NextResponse } from "next/server";
export async function middleware(req, ev) {
    const { pathname } = req.nextUrl;
    if (pathname == "/") {
        return NextResponse.redirect("/feed");
    }
    return NextResponse.next();
}
