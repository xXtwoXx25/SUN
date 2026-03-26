/**
 * Barrel export for all UI components
 * Import UI components from this file for cleaner imports
 * 
 * @example
 * import { Button, Input, Card, CardContent } from '@/components/ui';
 */

// Core inputs
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { Label } from './label';
export { Switch } from './switch';
export { Slider } from './slider';

// Form components
export {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
} from './select';
export { RadioGroup, RadioGroupItem } from './radio-group';
export {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from './input-otp';

// Cards
export {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from './card';

// Overlays & Dialogs
export {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from './dialog';
export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './alert-dialog';
export {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from './sheet';
export {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './popover';
export {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from './hover-card';

// Dropdown & Menus
export {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuGroup,
    DropdownMenuShortcut,
} from './dropdown-menu';
export {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuCheckboxItem,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuLabel,
    ContextMenuShortcut,
    ContextMenuGroup,
} from './context-menu';
export {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from './command';

// Navigation
export {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from './tabs';
export {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './accordion';
export {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
    navigationMenuTriggerStyle,
} from './navigation-menu';
export {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from './breadcrumb';
export {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from './pagination';

// Feedback
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Progress } from './progress';
export { Skeleton } from './skeleton';
export { Badge, badgeVariants } from './badge';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';

// Toggle
export { Toggle, toggleVariants } from './toggle';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';

// Layout
export { Separator } from './separator';
export { ScrollArea, ScrollBar } from './scroll-area';
export { AspectRatio } from './aspect-ratio';
export {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from './resizable';

// Data Display
export {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from './table';
export {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from './carousel';

// Tooltip
export {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';

// Calendar
export { Calendar } from './calendar';

// Collapsible
export {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from './collapsible';
