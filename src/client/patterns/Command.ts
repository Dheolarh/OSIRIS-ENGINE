// Command pattern for undo/redo functionality
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

export class CommandManager {
  private history: Command[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  execute(command: Command): void {
    // Remove any commands after current index (handles branching history)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Execute the command
    command.execute();
    
    // Add to history
    this.history.push(command);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): boolean {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      if (command) {
        command.undo();
        this.currentIndex--;
        return true;
      }
    }
    return false;
  }

  redo(): boolean {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      if (command) {
        command.execute();
        return true;
      }
    }
    return false;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getUndoDescription(): string | null {
    if (this.canUndo() && this.history[this.currentIndex]) {
      return this.history[this.currentIndex]!.description;
    }
    return null;
  }

  getRedoDescription(): string | null {
    if (this.canRedo() && this.history[this.currentIndex + 1]) {
      return this.history[this.currentIndex + 1]!.description;
    }
    return null;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

// Global command manager
export const commandManager = new CommandManager();