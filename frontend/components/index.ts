/**
 * Component Library Entry Point
 * すべての再利用可能なコンポーネントのエクスポート
 */

// UI Components (Atomic Design - Atoms)
export { Button, buttonVariants } from './ui/button'
export type { ButtonProps } from './ui/button'

export { Input } from './ui/input'
export type { InputProps } from './ui/input'

export { Label } from './ui/label'
export { Checkbox } from './ui/checkbox'
export { RadioGroup, RadioGroupItem } from './ui/radio-group'
export { Switch } from './ui/switch'
export { Textarea } from './ui/textarea'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export { Badge } from './ui/badge'
export { Separator } from './ui/separator'
export { Skeleton } from './ui/skeleton'
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

// UI Components (Atomic Design - Molecules)
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
export { Alert, AlertDescription, AlertTitle } from './ui/alert'
export { Progress } from './ui/progress'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'

// UI Components (Atomic Design - Organisms)
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
export { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

// Layout Components
export { Container, containerVariants } from './layout/container'
export type { ContainerProps } from './layout/container'

// Feedback Components  
export { Modal, ModalHeader, ModalBody, ModalFooter, modalVariants } from './feedback/modal'
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps } from './feedback/modal'

// Navigation Components
export { NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport } from './ui/navigation-menu'
export { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb'
export { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from './ui/menubar'

// Form Components
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form'

// Data Display Components
export { Calendar } from './ui/calendar'
export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel'
export { Chart, ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart'

// Interactive Components
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
export { Toggle } from './ui/toggle'
export { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'
export { Slider } from './ui/slider'

// Overlay Components
export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
export { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from './ui/context-menu'
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './ui/command'

// Toast & Notification Components
export { Toaster } from './ui/toaster'
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './ui/toast'
export { useToast, toast } from '@/hooks/use-toast'

// Input Components (Advanced)
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './ui/input-otp'

// Layout Components (Advanced)
export { AspectRatio } from './ui/aspect-ratio'
export { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable'
export { ScrollArea, ScrollBar } from './ui/scroll-area'

// Theme Provider
export { ThemeProvider } from './theme-provider'

// Utility Re-exports
export { cn } from '@/lib/utils'

/**
 * Component Categories for Documentation
 */
export const COMPONENT_CATEGORIES = {
  // Atoms - 最小の構成要素
  atoms: [
    'Button',
    'Input', 
    'Label',
    'Badge',
    'Separator',
    'Skeleton',
    'Avatar',
    'Switch',
    'Checkbox',
    'RadioGroup',
    'Slider',
    'Toggle',
    'Progress',
  ],
  
  // Molecules - 複数のatomsを組み合わせた構成要素
  molecules: [
    'Card',
    'Alert',
    'Tabs',
    'Accordion',
    'Select',
    'Textarea',
    'Form',
    'Calendar',
    'InputOTP',
  ],
  
  // Organisms - 複雑な機能を持つ構成要素
  organisms: [
    'Dialog',
    'AlertDialog',
    'Modal',
    'Table',
    'NavigationMenu',
    'Breadcrumb',
    'Menubar',
    'Carousel',
    'Chart',
    'Command',
  ],
  
  // Layout - レイアウト関連コンポーネント
  layout: [
    'Container',
    'AspectRatio',
    'ResizablePanel',
    'ScrollArea',
  ],
  
  // Overlay - オーバーレイ系コンポーネント
  overlay: [
    'Popover',
    'DropdownMenu',
    'Sheet',
    'Drawer',
    'Tooltip',
    'HoverCard',
    'ContextMenu',
  ],
  
  // Interactive - インタラクティブなコンポーネント
  interactive: [
    'Collapsible',
    'ToggleGroup',
  ],
  
  // Feedback - フィードバック系コンポーネント
  feedback: [
    'Toast',
    'Toaster',
  ],
} as const

/**
 * コンポーネントのアクセシビリティ対応レベル
 */
export const ACCESSIBILITY_LEVELS = {
  // WCAG AA準拠
  wcagAA: [
    'Button',
    'Input',
    'Label', 
    'Dialog',
    'AlertDialog',
    'Modal',
    'Alert',
    'Form',
    'NavigationMenu',
    'Breadcrumb',
    'Table',
  ],
  
  // WCAG AAA準拠
  wcagAAA: [
    'Container',
  ],
  
  // 基本的なアクセシビリティ対応
  basic: [
    'Badge',
    'Separator',
    'Skeleton',
    'Card',
    'Progress',
  ],
} as const