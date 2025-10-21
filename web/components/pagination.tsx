import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PaginationMeta } from "@/lib/api";
import { useState } from "react";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNextPage, hasPrevPage } = meta;
  const [inputPage, setInputPage] = useState("");

  const handleGoToPage = () => {
    const pageNum = parseInt(inputPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setInputPage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleGoToPage();
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    // If 7 pages or less, show all
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // If current page is near the start (1, 2, 3, 4)
    if (page <= 4) {
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
    // If current page is near the end
    else if (page >= totalPages - 3) {
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    }
    // Current page is in the middle
    else {
      pages.push('...');
      pages.push(page - 1);
      pages.push(page);
      pages.push(page + 1);
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({meta.total} items)
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, idx) => (
            typeof pageNum === 'number' ? (
              <Button
                key={idx}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            ) : (
              <span key={idx} className="px-2 text-muted-foreground">
                {pageNum}
              </span>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Go to:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`1-${totalPages}`}
            className="w-20 h-8"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToPage}
            disabled={!inputPage}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
}
