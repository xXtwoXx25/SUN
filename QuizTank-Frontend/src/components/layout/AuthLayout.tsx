import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    backTo?: string;
    backText?: string;
}

const AuthLayout = ({
    children,
    title,
    subtitle,
    backTo = "/",
    backText = "Back to Home",
}: AuthLayoutProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 py-10 sm:py-20">
            {/* Centered Form Content */}
            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                    <div className="bg-muted rounded-full p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    {backText}
                </Link>

                <div className="mb-8 ">
                    <h2 className="text-3xl font-black text-foreground mb-2.5">
                        {title || "Welcome"}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                        {subtitle || "Please sign in to continue"}
                    </p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-neumorphic p-1">
                    <div className="bg-white rounded-[1.8rem] border border-gray-100 p-6 sm:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
