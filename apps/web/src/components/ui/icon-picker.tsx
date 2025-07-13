"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

// Comprehensive Lucide React icon list organized by categories
export const LUCIDE_ICON_LIST = {
  "People & Users": [
    { value: "User", label: "User", component: LucideIcons.User },
    { value: "Users", label: "Users", component: LucideIcons.Users },
    { value: "UserCheck", label: "User Check", component: LucideIcons.UserCheck },
    { value: "UserPlus", label: "User Plus", component: LucideIcons.UserPlus },
    { value: "UserMinus", label: "User Minus", component: LucideIcons.UserMinus },
    { value: "UserX", label: "User X", component: LucideIcons.UserX },
    { value: "Crown", label: "Crown", component: LucideIcons.Crown },
    { value: "Shield", label: "Shield", component: LucideIcons.Shield },
    { value: "Contact", label: "Contact", component: LucideIcons.Contact },
    { value: "UserCog", label: "User Settings", component: LucideIcons.UserCog }
  ],
  "Business & Work": [
    { value: "Briefcase", label: "Briefcase", component: LucideIcons.Briefcase },
    { value: "Building", label: "Building", component: LucideIcons.Building },
    { value: "Building2", label: "Building 2", component: LucideIcons.Building2 },
    { value: "Factory", label: "Factory", component: LucideIcons.Factory },
    { value: "Store", label: "Store", component: LucideIcons.Store },
    { value: "Handshake", label: "Handshake", component: LucideIcons.Handshake },
    { value: "Target", label: "Target", component: LucideIcons.Target },
    { value: "TrendingUp", label: "Trending Up", component: LucideIcons.TrendingUp },
    { value: "BarChart", label: "Bar Chart", component: LucideIcons.BarChart },
    { value: "PieChart", label: "Pie Chart", component: LucideIcons.PieChart }
  ],
  "Fashion & Style": [
    { value: "Shirt", label: "Shirt", component: LucideIcons.Shirt },
    { value: "Glasses", label: "Glasses", component: LucideIcons.Glasses },
    { value: "Watch", label: "Watch", component: LucideIcons.Watch },
    { value: "Gem", label: "Gem", component: LucideIcons.Gem },
    { value: "Palette", label: "Palette", component: LucideIcons.Palette },
    { value: "Sparkles", label: "Sparkles", component: LucideIcons.Sparkles },
    { value: "Star", label: "Star", component: LucideIcons.Star },
    { value: "Heart", label: "Heart", component: LucideIcons.Heart },
    { value: "Scissors", label: "Scissors", component: LucideIcons.Scissors },
    { value: "Paintbrush", label: "Paintbrush", component: LucideIcons.Paintbrush }
  ],
  "Media & Photography": [
    { value: "Camera", label: "Camera", component: LucideIcons.Camera },
    { value: "Video", label: "Video", component: LucideIcons.Video },
    { value: "Film", label: "Film", component: LucideIcons.Film },
    { value: "Image", label: "Image", component: LucideIcons.Image },
    { value: "Images", label: "Images", component: LucideIcons.Images },
    { value: "Aperture", label: "Aperture", component: LucideIcons.Aperture },
    { value: "Focus", label: "Focus", component: LucideIcons.Focus },
    { value: "Eye", label: "Eye", component: LucideIcons.Eye },
    { value: "Play", label: "Play", component: LucideIcons.Play },
    { value: "Pause", label: "Pause", component: LucideIcons.Pause }
  ],
  "Sports & Fitness": [
    { value: "Dumbbell", label: "Dumbbell", component: LucideIcons.Dumbbell },
    { value: "Activity", label: "Activity", component: LucideIcons.Activity },
    { value: "Zap", label: "Zap", component: LucideIcons.Zap },
    { value: "Award", label: "Award", component: LucideIcons.Award },
    { value: "Medal", label: "Medal", component: LucideIcons.Medal },
    { value: "Trophy", label: "Trophy", component: LucideIcons.Trophy },
    { value: "Flame", label: "Flame", component: LucideIcons.Flame },
    { value: "Timer", label: "Timer", component: LucideIcons.Timer },
    { value: "Clock", label: "Clock", component: LucideIcons.Clock },
    { value: "Stopwatch", label: "Stopwatch", component: LucideIcons.Timer }
  ],
  "Location & Geography": [
    { value: "MapPin", label: "Map Pin", component: LucideIcons.MapPin },
    { value: "Map", label: "Map", component: LucideIcons.Map },
    { value: "Globe", label: "Globe", component: LucideIcons.Globe },
    { value: "Compass", label: "Compass", component: LucideIcons.Compass },
    { value: "Navigation", label: "Navigation", component: LucideIcons.Navigation },
    { value: "Plane", label: "Plane", component: LucideIcons.Plane },
    { value: "Car", label: "Car", component: LucideIcons.Car },
    { value: "Home", label: "Home", component: LucideIcons.Home },
    { value: "Mountain", label: "Mountain", component: LucideIcons.Mountain },
    { value: "Trees", label: "Trees", component: LucideIcons.Trees }
  ],
  "Organization & Files": [
    { value: "Folder", label: "Folder", component: LucideIcons.Folder },
    { value: "FolderOpen", label: "Folder Open", component: LucideIcons.FolderOpen },
    { value: "File", label: "File", component: LucideIcons.File },
    { value: "Files", label: "Files", component: LucideIcons.Files },
    { value: "Archive", label: "Archive", component: LucideIcons.Archive },
    { value: "Box", label: "Box", component: LucideIcons.Box },
    { value: "Package", label: "Package", component: LucideIcons.Package },
    { value: "Layers", label: "Layers", component: LucideIcons.Layers },
    { value: "Database", label: "Database", component: LucideIcons.Database },
    { value: "HardDrive", label: "Hard Drive", component: LucideIcons.HardDrive }
  ],
  "Tools & Measurements": [
    { value: "Ruler", label: "Ruler", component: LucideIcons.Ruler },
    { value: "Scale", label: "Scale", component: LucideIcons.Scale },
    { value: "Calculator", label: "Calculator", component: LucideIcons.Calculator },
    { value: "Wrench", label: "Wrench", component: LucideIcons.Wrench },
    { value: "Settings", label: "Settings", component: LucideIcons.Settings },
    { value: "Tool", label: "Tool", component: LucideIcons.Wrench },
    { value: "PenTool", label: "Pen Tool", component: LucideIcons.PenTool },
    { value: "Edit", label: "Edit", component: LucideIcons.Edit },
    { value: "Cog", label: "Cog", component: LucideIcons.Cog },
    { value: "Hammer", label: "Hammer", component: LucideIcons.Hammer }
  ],
  "Communication": [
    { value: "Mail", label: "Mail", component: LucideIcons.Mail },
    { value: "Phone", label: "Phone", component: LucideIcons.Phone },
    { value: "MessageCircle", label: "Message Circle", component: LucideIcons.MessageCircle },
    { value: "MessageSquare", label: "Message Square", component: LucideIcons.MessageSquare },
    { value: "Send", label: "Send", component: LucideIcons.Send },
    { value: "Bell", label: "Bell", component: LucideIcons.Bell },
    { value: "Megaphone", label: "Megaphone", component: LucideIcons.Megaphone },
    { value: "Radio", label: "Radio", component: LucideIcons.Radio },
    { value: "Wifi", label: "WiFi", component: LucideIcons.Wifi },
    { value: "Bluetooth", label: "Bluetooth", component: LucideIcons.Bluetooth }
  ],
  "General & Misc": [
    { value: "Circle", label: "Circle", component: LucideIcons.Circle },
    { value: "Square", label: "Square", component: LucideIcons.Square },
    { value: "Triangle", label: "Triangle", component: LucideIcons.Triangle },
    { value: "Diamond", label: "Diamond", component: LucideIcons.Diamond },
    { value: "Bookmark", label: "Bookmark", component: LucideIcons.Bookmark },
    { value: "Tag", label: "Tag", component: LucideIcons.Tag },
    { value: "Flag", label: "Flag", component: LucideIcons.Flag },
    { value: "Plus", label: "Plus", component: LucideIcons.Plus },
    { value: "Minus", label: "Minus", component: LucideIcons.Minus },
    { value: "X", label: "X", component: LucideIcons.X }
  ]
};

// Flatten the icon list for easy searching
export const ALL_LUCIDE_ICONS = Object.values(LUCIDE_ICON_LIST).flat();

interface IconPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function IconPicker({
  value,
  onValueChange,
  placeholder = "Select an icon...",
  disabled = false,
  className
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedIcon = ALL_LUCIDE_ICONS.find(icon => icon.value === value);
  
  const filteredIcons = searchTerm
    ? ALL_LUCIDE_ICONS.filter(icon =>
        icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ALL_LUCIDE_ICONS;

  const filteredCategories = Object.entries(LUCIDE_ICON_LIST).reduce((acc, [category, icons]) => {
    const filtered = icons.filter(icon =>
      searchTerm
        ? icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.value.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof ALL_LUCIDE_ICONS>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {selectedIcon ? (
              <>
                <selectedIcon.component className="h-4 w-4" />
                <span>{selectedIcon.label}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedIcon.value}
                </Badge>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search icons..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {Object.keys(filteredCategories).length === 0 ? (
              <CommandEmpty>No icons found.</CommandEmpty>
            ) : (
              Object.entries(filteredCategories).map(([category, icons]) => (
                <CommandGroup key={category} heading={category}>
                  {icons.map((icon) => (
                    <CommandItem
                      key={icon.value}
                      value={icon.value}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer"
                    >
                      <icon.component className="h-4 w-4" />
                      <span className="flex-1">{icon.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {icon.value}
                      </Badge>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === icon.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 