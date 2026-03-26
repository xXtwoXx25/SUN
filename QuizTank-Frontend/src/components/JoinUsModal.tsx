import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface JoinUsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function JoinUsModal({ isOpen, onOpenChange }: JoinUsModalProps) {
    const navigate = useNavigate();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl mt-4">Join us to continue</DialogTitle>
                    <DialogDescription className="text-center">
                        Sign in or create an account to access this feature
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 mt-2 mb-2">
                    <Button onClick={() => navigate("/login")} className="w-full">
                        Sign In
                    </Button>
                    <Button onClick={() => navigate("/register")} variant="outline" className="w-full">
                        Register
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
