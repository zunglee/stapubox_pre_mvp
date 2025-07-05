"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface MultiSelectProps {
  options: string[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  maxDisplay?: number
}

export function MultiSelect({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Select options...",
  maxDisplay = 3 
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onValueChange(value.filter((i) => i !== item))
  }

  const handleSelect = (item: string) => {
    if (value.includes(item)) {
      handleUnselect(item)
    } else {
      onValueChange([...value, item])
    }
  }

  const displayText = () => {
    if (value.length === 0) {
      return placeholder
    }
    return `${value.length} selected`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
        >
          <span className="truncate">{displayText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 border rounded ${
                      value.includes(option) 
                        ? 'bg-primary border-primary' 
                        : 'border-gray-300'
                    }`}>
                      {value.includes(option) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        </div>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface MultiSelectWithBadgesProps extends MultiSelectProps {
  showBadges?: boolean
}

export function MultiSelectWithBadges({ 
  showBadges = true, 
  ...props 
}: MultiSelectWithBadgesProps) {
  const handleUnselect = (item: string) => {
    props.onValueChange(props.value.filter((i) => i !== item))
  }

  return (
    <div className="space-y-2">
      <MultiSelect {...props} />
      {showBadges && props.value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {props.value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              {item}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}