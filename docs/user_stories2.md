# User Story: Markdown File Referencing

## Core Story
As a user, I want to be able to reference markdown files like in the canvas Obsidian application, so that I can organize better my canvas by linking .md files with bidirectional editing capabilities.

## Detailed Requirements

### Linking Markdown Files
- As a user, I want to drag and drop .md files onto the canvas
- As a user, I want to browse and select .md files from my file system
- As a user, I want to see a visual representation of the linked markdown file on the canvas
- As a user, I want to position and resize markdown file references freely on the canvas

### Visual Representation
- As a user, I want to see a preview of the markdown content in a card/node format
- As a user, I want to see the filename and path of the referenced file
- As a user, I want to distinguish between different types of content through visual styling
- As a user, I want to see a truncated preview when the content is too long

### Editing Capabilities
- As a user, I want to double-click on a markdown reference to open it for editing
- As a user, I want to edit the markdown content directly within the canvas interface
- As a user, I want my edits to automatically save to the original file
- As a user, I want to see real-time updates when the original file is modified externally
- As a user, I want to toggle between preview mode and edit mode

### File Management
- As a user, I want to see if a referenced file has been moved or deleted
- As a user, I want to update file paths when files are relocated
- As a user, I want to maintain references even when files are renamed
- As a user, I want to handle relative and absolute file paths

### Organization Benefits
- As a user, I want to create visual connections between related markdown files
- As a user, I want to group related documents spatially on the canvas
- As a user, I want to create a visual knowledge map of my markdown documentation
- As a user, I want to navigate between linked files seamlessly

## Acceptance Criteria
- [ ] Can drag and drop .md files onto canvas
- [ ] File references display with preview content
- [ ] Double-click opens edit mode
- [ ] Edits save to original file immediately
- [ ] External file changes reflect in canvas
- [ ] Broken file links are visually indicated
- [ ] File paths can be updated when files move
- [ ] Canvas layout persists with file references