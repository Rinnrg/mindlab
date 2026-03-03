"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { cn } from "@/lib/utils"
import {
  Play,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  MoreVertical,
  Copy,
  Code2,
  Plus,
  Terminal,
  PlayCircle,
  Upload,
  FileDown,
  Sparkles,
  Check,
  X,
  FileText,
  Printer,
  Package,
  Braces,
  SquareTerminal,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
type OutputSegment = {
  type: "text" | "image"
  content: string
}

type CodeCell = {
  id: string
  code: string
  output: string
  isError: boolean
  executionCount: number | null
  images?: string[]
  isRunning?: boolean
  outputSegments?: OutputSegment[]
  isOutputCollapsed?: boolean
  cellType?: "code" | "markdown"
  isFocused?: boolean
}

type InstalledPackage = {
  name: string
  timestamp: number
}

interface PythonCompilerProps {
  onBack: () => void
}

const DEFAULT_PYTHON_CODE = `print("Halo dari Mindlab!")
for i in range(6):
    print(i)`

let cellIdCounter = 0

export default function PythonCompiler({ onBack }: PythonCompilerProps) {
  const { t } = useAutoTranslate()

  const [cells, setCells] = useState<CodeCell[]>(() => [
    {
      id: `cell-${cellIdCounter++}`,
      code: DEFAULT_PYTHON_CODE,
      output: "",
      isError: false,
      executionCount: null,
      images: [],
      isRunning: false,
      outputSegments: [],
      isOutputCollapsed: false,
      cellType: "code",
      isFocused: false,
    },
  ])
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([])
  const [globalExecutionCount, setGlobalExecutionCount] = useState(0)
  const [copySuccess, setCopySuccess] = useState(false)

  // Fungsi untuk menambah cell baru
  const addCell = (cellType: "code" | "markdown" = "code", insertIndex?: number) => {
    const newCell: CodeCell = {
      id: `cell-${cellIdCounter++}`,
      code: "",
      output: "",
      isError: false,
      executionCount: null,
      images: [],
      isRunning: false,
      outputSegments: [],
      isOutputCollapsed: false,
      cellType,
      isFocused: false,
    }

    if (insertIndex !== undefined) {
      // Insert at specific position
      const newCells = [...cells]
      newCells.splice(insertIndex, 0, newCell)
      setCells(newCells)
    } else {
      // Add at end
      setCells([...cells, newCell])
    }
  }

  // Fungsi untuk menghapus cell
  const deleteCell = (id: string) => {
    setCells(cells.filter((cell) => cell.id !== id))
  }

  // Fungsi untuk update code di cell
  const updateCellCode = (id: string, newCode: string) => {
    setCells(cells.map((cell) => (cell.id === id ? { ...cell, code: newCode } : cell)))
  }

  // Toggle output collapse
  const toggleOutputCollapse = (id: string) => {
    setCells(cells.map((cell) => (cell.id === id ? { ...cell, isOutputCollapsed: !cell.isOutputCollapsed } : cell)))
  }

  // Copy output
  const copyOutput = (output: string) => {
    navigator.clipboard.writeText(output)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Set focused cell
  const setFocusedCell = (id: string) => {
    setCells(cells.map((cell) => ({ ...cell, isFocused: cell.id === id })))
  }

  // Run all cells
  const runAllCells = async () => {
    for (const cell of cells) {
      if (cell.cellType === "code" || !cell.cellType) {
        await runCell(cell.id)
      }
    }
  }

  // Import file
  const importFile = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".py,.ipynb"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()

      if (file.name.endsWith(".ipynb")) {
        try {
          const notebook = JSON.parse(text)
          const newCells: CodeCell[] = notebook.cells.map((cell: { cell_type: string; source: string[] }) => ({
            id: `cell-${cellIdCounter++}`,
            code: Array.isArray(cell.source) ? cell.source.join("") : cell.source,
            output: "",
            isError: false,
            executionCount: null,
            images: [],
            isRunning: false,
            outputSegments: [],
            isOutputCollapsed: false,
            cellType: cell.cell_type === "markdown" ? "markdown" : "code",
            isFocused: false,
          }))
          setCells(newCells)
        } catch {
          console.error("Failed to parse notebook")
        }
      } else {
        setCells([
          {
            id: `cell-${cellIdCounter++}`,
            code: text,
            output: "",
            isError: false,
            executionCount: null,
            images: [],
            isRunning: false,
            outputSegments: [],
            isOutputCollapsed: false,
            cellType: "code",
            isFocused: false,
          },
        ])
      }
    }
    input.click()
  }

  // Export file
  const exportFile = () => {
    const notebook = {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3",
        },
      },
      cells: cells.map((cell) => ({
        cell_type: cell.cellType === "markdown" ? "markdown" : "code",
        source: cell.code.split("\n").map((line, i, arr) => (i < arr.length - 1 ? line + "\n" : line)),
        metadata: {},
        outputs: cell.output
          ? [
              {
                output_type: "stream",
                name: "stdout",
                text: cell.output.split("\n").map((line, i, arr) => (i < arr.length - 1 ? line + "\n" : line)),
              },
            ]
          : [],
        execution_count: cell.executionCount,
      })),
    }

    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "notebook.ipynb"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print notebook
  const printNotebook = () => {
    window.print()
  }

  // Animate output
  const animateOutput = async (cellId: string, output: string, isError: boolean) => {
    const lines = output.split("\n")
    let currentOutput = ""

    for (const line of lines) {
      currentOutput += (currentOutput ? "\n" : "") + line
      setCells((prevCells) =>
        prevCells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                output: currentOutput,
                isError,
              }
            : c,
        ),
      )
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
  }

  // Execute Python code through our backend API (avoids CORS issues)
  const runPythonCode = async (code: string, _cellId: string): Promise<string> => {
    try {
      const response = await fetch("/api/compiler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
        }),
      })

      const data = await response.json()

      if (data.stderr && data.stderr.length > 0) {
        // If there's both stdout and stderr, show both
        if (data.stdout && data.stdout.length > 0) {
          return data.stdout + "\n" + data.stderr
        }
        return data.stderr
      }

      if (data.stdout && data.stdout.length > 0) {
        return data.stdout
      }

      // No output at all (e.g. code like `x = 1` with no print)
      return ""
    } catch (error) {
      console.error("Compiler API error:", error)
      return "Error: Failed to connect to compiler service. Please check your connection and try again."
    }
  }

  // Run a single cell
  const runCell = async (cellId: string) => {
    const cell = cells.find((c) => c.id === cellId)
    if (!cell || cell.cellType === "markdown") return

    // Set running state
    setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, isRunning: true, output: "", outputSegments: [] } : c)))

    const newCount = globalExecutionCount + 1
    setGlobalExecutionCount(newCount)

    // Check for pip install - simulate package install
    if (cell.code.trim().startsWith("!pip install") || cell.code.trim().startsWith("pip install")) {
      const packageMatch = cell.code.match(/pip install\s+([^\s]+)/)
      if (packageMatch) {
        const packageName = packageMatch[1]
        const installOutput = `Collecting ${packageName}\n  Downloading ${packageName}-1.0.0-py3-none-any.whl (50 kB)\nInstalling collected packages: ${packageName}\nSuccessfully installed ${packageName}-1.0.0`

        setInstalledPackages((prev) => {
          if (!prev.find((p) => p.name === packageName)) {
            return [...prev, { name: packageName, timestamp: Date.now() }]
          }
          return prev
        })

        setCells((prev) =>
          prev.map((c) =>
            c.id === cellId
              ? {
                  ...c,
                  output: installOutput,
                  isError: false,
                  executionCount: newCount,
                  isRunning: false,
                }
              : c,
          ),
        )

        await animateOutput(cellId, installOutput, false)
        return
      }
    }

    // Strip leading "!" from lines (Jupyter-style shell commands) for actual execution
    let codeToRun = cell.code
    // If the entire code is just a pip install, we already handled it above
    // For other code, send it to the API as-is

    // Run Python code via backend API
    const output = await runPythonCode(codeToRun, cellId)

    // Determine if the output is an error based on Python traceback patterns
    const isError =
      output.includes("Traceback (most recent call last)") ||
      output.includes("SyntaxError:") ||
      output.includes("NameError:") ||
      output.includes("TypeError:") ||
      output.includes("ValueError:") ||
      output.includes("IndexError:") ||
      output.includes("KeyError:") ||
      output.includes("AttributeError:") ||
      output.includes("ImportError:") ||
      output.includes("ModuleNotFoundError:") ||
      output.includes("ZeroDivisionError:") ||
      output.includes("FileNotFoundError:") ||
      output.includes("RuntimeError:") ||
      output.includes("IndentationError:") ||
      output.includes("TabError:") ||
      output.includes("RecursionError:") ||
      output.includes("StopIteration:") ||
      output.includes("OverflowError:") ||
      output.includes("MemoryError")

    setCells((prevCells) =>
      prevCells.map((c) =>
        c.id === cellId
          ? {
              ...c,
              output,
              isError,
              executionCount: newCount,
              isRunning: false,
            }
          : c,
      ),
    )

    if (output) {
      await animateOutput(cellId, output, isError)
    } else {
      // No output - just mark as completed
      setCells((prevCells) =>
        prevCells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                output: "",
                isError: false,
                executionCount: newCount,
                isRunning: false,
              }
            : c,
        ),
      )
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden relative">
      {/* Toast Notification - iOS Style */}
      {copySuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={cn(
            "flex items-center gap-2.5 px-5 py-3 rounded-2xl",
            "bg-foreground/90 dark:bg-white/90",
            "text-background dark:text-black",
            "backdrop-blur-xl shadow-2xl shadow-black/20",
            "border border-white/10 dark:border-black/10"
          )}>
            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium">{t("outputCopied")}</span>
          </div>
        </div>
      )}

      {/* ─── Header Bar ─── iOS Navigation Bar Style */}
      <div className={cn(
        "flex-shrink-0 z-40",
        "bg-card/80 backdrop-blur-xl",
        "border-b border-border/50",
        "supports-[backdrop-filter]:bg-card/60"
      )}>
        {/* Top row */}
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          {/* Left section */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back button */}
            <button
              onClick={onBack}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                "bg-primary/10 hover:bg-primary/20 active:scale-95",
                "text-primary transition-all duration-200",
                "md:h-8 md:w-auto md:px-3 md:gap-1.5 md:rounded-lg"
              )}
            >
              <ChevronLeft className="h-4.5 w-4.5 md:h-4 md:w-4" />
              <span className="hidden md:inline text-sm font-medium">{t("back")}</span>
            </button>

            {/* Logo & Title */}
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600",
                "shadow-lg shadow-blue-500/30"
              )}>
                <Braces className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate leading-tight">{t("compilerTitle")}</h2>
                <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">{t("compilerVersion")}</p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1.5">
            {installedPackages.length > 0 && (
              <div className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                "bg-green-500/10 text-green-600 dark:text-green-400",
                "text-xs font-medium"
              )}>
                <Package className="h-3 w-3" />
                {installedPackages.length} pkg
              </div>
            )}

            {/* Run All Button */}
            <button
              onClick={runAllCells}
              className={cn(
                "h-9 flex items-center gap-1.5 px-3 rounded-xl",
                "bg-green-500 hover:bg-green-600 active:scale-95",
                "text-white text-sm font-medium",
                "shadow-lg shadow-green-500/30",
                "transition-all duration-200",
                "cursor-pointer"
              )}
            >
              <PlayCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("runAll")}</span>
            </button>

            {/* More Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="More options"
                  className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center",
                  "hover:bg-muted/80 active:scale-95",
                  "text-muted-foreground hover:text-foreground",
                  "transition-all duration-200 cursor-pointer"
                )}>
                  <MoreVertical className="h-4.5 w-4.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-1.5 rounded-2xl border-border/50 shadow-2xl bg-popover/95 backdrop-blur-xl">
                <div className="space-y-0.5">
                  {/* Mobile only: add cells */}
                  <button
                    onClick={() => addCell("code")}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer md:hidden"
                  >
                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Code2 className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    {t("addCode")}
                  </button>
                  <button
                    onClick={() => addCell("markdown")}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer md:hidden"
                  >
                    <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    {t("addText")}
                  </button>
                  <div className="border-t border-border/50 my-1 md:hidden"></div>
                  <button
                    onClick={importFile}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Upload className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    {t("importFile")}
                  </button>
                  <button
                    onClick={exportFile}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <FileDown className="h-3.5 w-3.5 text-teal-500" />
                    </div>
                    {t("exportFile")}
                  </button>
                  <div className="border-t border-border/50 my-1"></div>
                  <button
                    onClick={printNotebook}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                      <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    {t("printNotebook")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Desktop action bar */}
        <div className="hidden md:flex items-center gap-2 px-5 pb-2.5">
          <button
            onClick={() => addCell("code")}
            className={cn(
              "h-8 flex items-center gap-1.5 px-3 rounded-lg",
              "bg-muted/80 hover:bg-muted text-foreground",
              "text-xs font-medium transition-all duration-200",
              "active:scale-95 cursor-pointer"
            )}
          >
            <Code2 className="h-3.5 w-3.5 text-blue-500" />
            {t("addCode")}
          </button>
          <button
            onClick={() => addCell("markdown")}
            className={cn(
              "h-8 flex items-center gap-1.5 px-3 rounded-lg",
              "bg-muted/80 hover:bg-muted text-foreground",
              "text-xs font-medium transition-all duration-200",
              "active:scale-95 cursor-pointer"
            )}
          >
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            {t("addText")}
          </button>
        </div>
      </div>

      {/* ─── Cell Area ─── */}
      <div className="flex-1 overflow-y-auto w-full scrollbar-colab">
        {cells.length === 0 ? (
          /* Empty State - iOS Style */
          <div className="flex items-center justify-center h-full w-full px-6">
            <div className="text-center space-y-5 max-w-xs">
              <div className={cn(
                "h-20 w-20 mx-auto rounded-3xl flex items-center justify-center",
                "bg-gradient-to-br from-blue-500/20 via-primary/10 to-purple-500/20",
                "border border-primary/10"
              )}>
                <SquareTerminal className="h-10 w-10 text-primary/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t("noCell")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("noCellDesc")}</p>
              </div>
              <button
                onClick={() => addCell("code")}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl",
                  "bg-primary text-primary-foreground",
                  "text-sm font-medium",
                  "shadow-lg shadow-primary/30",
                  "hover:shadow-xl hover:shadow-primary/40",
                  "active:scale-95 transition-all duration-200",
                  "cursor-pointer"
                )}
              >
                <Sparkles className="h-4 w-4" />
                {t("addNewCell")}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full scrollbar-colab px-2 sm:px-4 md:px-6 lg:px-8 py-4 space-y-3 pb-28 md:pb-6">
            {cells.map((cell, index) => (
              <div key={cell.id} className="relative w-full group/wrapper">
                {/* Insert cell divider - appears on hover between cells */}
                {index > 0 && (
                  <div className="group/insert -mt-1.5 mb-1.5 h-3 flex items-center justify-center relative z-20">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-border/0 group-hover/insert:bg-border/50 transition-colors" />
                    <div className="opacity-0 group-hover/insert:opacity-100 transition-all duration-200 flex gap-1 relative">
                      <button
                        onClick={() => addCell("code", index)}
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-medium rounded-full",
                          "bg-card border border-border/80 shadow-md",
                          "text-primary hover:bg-primary hover:text-primary-foreground",
                          "transition-all duration-200 cursor-pointer",
                          "active:scale-95"
                        )}
                      >
                        + Code
                      </button>
                      <button
                        onClick={() => addCell("markdown", index)}
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-medium rounded-full",
                          "bg-card border border-border/80 shadow-md",
                          "text-purple-500 hover:bg-purple-500 hover:text-white",
                          "transition-all duration-200 cursor-pointer",
                          "active:scale-95"
                        )}
                      >
                        + Text
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── Cell Card ─── */}
                <div
                  className={cn(
                    "relative rounded-2xl overflow-hidden transition-all duration-300",
                    "border shadow-sm",
                    cell.isFocused
                      ? "border-primary/40 shadow-lg shadow-primary/10 bg-card ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-border hover:shadow-md",
                  )}
                  onClick={() => setFocusedCell(cell.id)}
                >
                  {/* Cell header bar */}
                  <div className={cn(
                    "flex items-center justify-between px-3 py-2 gap-2",
                    "border-b",
                    cell.isFocused ? "border-primary/20 bg-primary/5" : "border-border/40 bg-muted/30"
                  )}>
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Cell type indicator */}
                      {(!cell.cellType || cell.cellType === "code") ? (
                        <div className={cn(
                          "h-6 px-2 rounded-md flex items-center gap-1.5",
                          "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          "text-[11px] font-semibold uppercase tracking-wider"
                        )}>
                          <Code2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Python</span>
                        </div>
                      ) : (
                        <div className={cn(
                          "h-6 px-2 rounded-md flex items-center gap-1.5",
                          "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                          "text-[11px] font-semibold uppercase tracking-wider"
                        )}>
                          <FileText className="h-3 w-3" />
                          <span className="hidden sm:inline">Markdown</span>
                        </div>
                      )}

                      {/* Execution count */}
                      {cell.executionCount !== null && (
                        <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                          [{cell.executionCount}]
                        </span>
                      )}

                      {/* Running indicator */}
                      {cell.isRunning && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="hidden sm:inline">Running...</span>
                        </div>
                      )}
                    </div>

                    {/* Cell actions */}
                    <div className="flex items-center gap-0.5">
                      {(!cell.cellType || cell.cellType === "code") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            runCell(cell.id)
                          }}
                          disabled={cell.isRunning}
                          className={cn(
                            "h-7 flex items-center gap-1 px-2 rounded-lg",
                            "text-xs font-medium transition-all duration-200",
                            "cursor-pointer active:scale-95",
                            cell.isRunning
                              ? "opacity-50 cursor-not-allowed"
                              : "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                          )}
                        >
                          <Play className="h-3 w-3" fill="currentColor" />
                          <span className="hidden sm:inline">{t("runAll") === "Run All" ? "Run" : "Jalankan"}</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteCell(cell.id)
                        }}
                        className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center",
                          "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                          "opacity-0 group-hover/wrapper:opacity-100 transition-all duration-200",
                          "cursor-pointer active:scale-95"
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Code editor / markdown area */}
                  <div className="relative">
                    {cell.cellType === "markdown" ? (
                      <textarea
                        value={cell.code}
                        onChange={(e) => updateCellCode(cell.id, e.target.value)}
                        placeholder={t("writeMarkdown")}
                        className={cn(
                          "w-full min-h-[80px] max-h-[300px] p-4 text-sm resize-none",
                          "bg-transparent border-none focus:outline-none focus:ring-0",
                          "overflow-y-auto font-mono",
                          "placeholder:text-muted-foreground/50"
                        )}
                      />
                    ) : (
                      <div className="relative editor-container">
                        <Editor
                          height={`${Math.max(cell.code.split("\n").length * 19 + 16, 50)}px`}
                          language="python"
                          value={cell.code}
                          onChange={(value) => updateCellCode(cell.id, value || "")}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 4,
                            wordWrap: "on",
                            padding: { top: 8, bottom: 8 },
                            scrollbar: {
                              vertical: "hidden",
                              horizontal: "hidden",
                              handleMouseWheel: true,
                              alwaysConsumeMouseWheel: false,
                            },
                            overviewRulerLanes: 0,
                            hideCursorInOverviewRuler: true,
                            overviewRulerBorder: false,
                            lineNumbersMinChars: 3,
                            folding: false,
                            glyphMargin: false,
                            renderLineHighlight: "line",
                            renderLineHighlightOnlyWhenFocus: true,
                            cursorBlinking: "smooth",
                            cursorSmoothCaretAnimation: "on",
                            smoothScrolling: true,
                            fontLigatures: true,
                            fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, monospace",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* ─── Output Area ─── */}
                  {(cell.output || (cell.outputSegments && cell.outputSegments.length > 0)) && (
                    <div className="border-t border-border/40">
                      {/* Output header */}
                      <div className={cn(
                        "flex items-center justify-between px-3 py-1.5",
                        "bg-muted/20"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-4.5 w-4.5 rounded flex items-center justify-center",
                            cell.isError ? "text-red-500" : "text-green-500"
                          )}>
                            {cell.isError ? (
                              <X className="h-3.5 w-3.5" />
                            ) : (
                              <Terminal className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            cell.isError ? "text-red-500" : "text-muted-foreground"
                          )}>
                            {cell.isError ? "Error" : t("output")}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => copyOutput(cell.output)}
                            className={cn(
                              "h-6 flex items-center gap-1 px-2 rounded-md",
                              "text-[11px] text-muted-foreground hover:text-foreground",
                              "hover:bg-muted/80 transition-all duration-200",
                              "cursor-pointer active:scale-95"
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span className="hidden sm:inline">{t("copyOutput")}</span>
                          </button>
                          <button
                            onClick={() => toggleOutputCollapse(cell.id)}
                            className={cn(
                              "h-6 flex items-center gap-1 px-2 rounded-md",
                              "text-[11px] text-muted-foreground hover:text-foreground",
                              "hover:bg-muted/80 transition-all duration-200",
                              "cursor-pointer active:scale-95"
                            )}
                          >
                            {cell.isOutputCollapsed ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronUp className="h-3 w-3" />
                            )}
                            <span className="hidden sm:inline">
                              {cell.isOutputCollapsed ? t("showOutput") : t("hideOutput")}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Output content */}
                      {!cell.isOutputCollapsed && (
                        <div className={cn(
                          "px-4 py-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap",
                          "max-h-[400px] overflow-y-auto scrollbar-hide",
                          cell.isError
                            ? "text-red-500 dark:text-red-400 bg-red-500/5"
                            : "text-foreground/90 bg-muted/10"
                        )}>
                          {cell.outputSegments && cell.outputSegments.length > 0 ? (
                            cell.outputSegments.map((segment, idx) => (
                              <div key={idx}>
                                {segment.type === "text" ? (
                                  <span>{segment.content}</span>
                                ) : (
                                  <img
                                    src={segment.content || "/placeholder.svg"}
                                    alt="Output chart"
                                    className="max-w-full h-auto rounded-lg mt-2 border border-border/30"
                                  />
                                )}
                              </div>
                            ))
                          ) : (
                            <span>{cell.output}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Add cell after last cell */}
                {index === cells.length - 1 && (
                  <div className="group/insert mt-1.5 h-6 flex items-center justify-center relative">
                    <div className="opacity-0 group-hover/insert:opacity-100 transition-all duration-200 flex gap-1 relative">
                      <button
                        onClick={() => addCell("code")}
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-medium rounded-full",
                          "bg-card border border-border/80 shadow-md",
                          "text-primary hover:bg-primary hover:text-primary-foreground",
                          "transition-all duration-200 cursor-pointer",
                          "active:scale-95"
                        )}
                      >
                        + Code
                      </button>
                      <button
                        onClick={() => addCell("markdown")}
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-medium rounded-full",
                          "bg-card border border-border/80 shadow-md",
                          "text-purple-500 hover:bg-purple-500 hover:text-white",
                          "transition-all duration-200 cursor-pointer",
                          "active:scale-95"
                        )}
                      >
                        + Text
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Mobile Floating Action Button ─── iOS Style */}
      {cells.length > 0 && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 md:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Add new cell"
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center",
                  "bg-primary text-primary-foreground",
                  "shadow-2xl shadow-primary/40",
                  "active:scale-90 transition-all duration-200",
                  "cursor-pointer",
                  "ring-4 ring-primary/20"
                )}
              >
                <Plus className="h-6 w-6" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-48 p-1.5 rounded-2xl border-border/50 shadow-2xl bg-popover/95 backdrop-blur-xl mb-2"
            >
              <button
                onClick={() => addCell("code")}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Code2 className="h-3.5 w-3.5 text-blue-500" />
                </div>
                {t("addCode")}
              </button>
              <button
                onClick={() => addCell("markdown")}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-purple-500" />
                </div>
                {t("addText")}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
