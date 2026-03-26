import { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="grid grid-cols-10">
            {/* Left gutter - column 1 */}
            <div className="col-span-1 hidden lg:block" />

            {/* Main content - columns 2-9 (8 columns) */}
            <main className="col-span-10 lg:col-span-8">
                {children}
            </main>

            {/* Right gutter - column 10 */}
            <div className="col-span-1 hidden lg:block" />
        </div>
    );
};

export default Layout;
