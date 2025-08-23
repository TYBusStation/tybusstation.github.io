import "./globals.css";

import Footer from "./(components)/Footer";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
        <head/>
        <body>
        {/* <Navbar /> */}
        <div
            className="min-h-screen bg-gradient-to-t from-zinc-800 to-zinc-900 p-2 md:flex items-center justify-center">
            {children}
        </div>
        <Footer/>
        </body>
        </html>
    );
}
