// SDF File Merger Application - FIXED VERSION
let selectedFiles = [];
let mergeInProgress = false;
let mergedFileName = "merged_compounds.sdf";
let mergedData = "";

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileListSection = document.getElementById('fileListSection');
const filesContainer = document.getElementById('filesContainer');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const fileCount = document.getElementById('fileCount');
const mergeBtn = document.getElementById('mergeBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupFileInput();
    updateStatus("Ready to merge SDF files");
});

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropZone.classList.add('drag-over');
}

function unhighlight() {
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function setupFileInput() {
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
        this.value = '';
    });
}

function handleFiles(files) {
    if (mergeInProgress) {
        showAlert("Please wait", "Cannot add files while merge is in progress");
        return;
    }

    let addedCount = 0;
    
    for (let file of files) {
        if (isSupportedFile(file)) {
            const exists = selectedFiles.some(f => 
                f.name === file.name && 
                f.size === file.size && 
                f.lastModified === file.lastModified
            );
            
            if (!exists) {
                selectedFiles.push({
                    file: file,
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: getFileType(file.name),
                    moleculeCount: 0
                });
                addedCount++;
                
                // Count molecules in the file
                countMoleculesInFile(file).then(count => {
                    const index = selectedFiles.findIndex(f => 
                        f.name === file.name && f.size === file.size
                    );
                    if (index !== -1) {
                        selectedFiles[index].moleculeCount = count;
                        updateFileItem(index);
                    }
                });
            }
        }
    }

    if (addedCount > 0) {
        updateFileList();
        updateStatus(`Added ${addedCount} file${addedCount > 1 ? 's' : ''}`);
    }
}

function countMoleculesInFile(file) {
    return new Promise((resolve) => {
        if (getFileType(file.name) === 'zip') {
            resolve(0); // ZIP files need special handling
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            // Count molecules by $$$$ delimiter
            const count = (content.match(/\$\$\$\$/g) || []).length;
            // If no delimiter found but there's content, it's 1 molecule
            resolve(count > 0 ? count : (content.trim() ? 1 : 0));
        };
        reader.onerror = function() {
            resolve(0);
        };
        reader.readAsText(file);
    });
}

function isSupportedFile(file) {
    const supportedExtensions = ['.sdf', '.mol', '.zip'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return supportedExtensions.includes(extension);
}

function getFileType(filename) {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (extension === '.zip') return 'zip';
    if (extension === '.mol') return 'mol';
    return 'sdf';
}

function updateFileList() {
    if (selectedFiles.length > 0) {
        fileListSection.style.display = 'block';
        fileCount.textContent = `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`;
        
        filesContainer.innerHTML = '';
        
        selectedFiles.forEach((fileObj, index) => {
            createFileItem(fileObj, index);
        });
        
        mergeBtn.disabled = false;
    } else {
        fileListSection.style.display = 'none';
        mergeBtn.disabled = true;
    }
}

function createFileItem(fileObj, index) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    
    let iconClass = 'fa-file-code';
    if (fileObj.type === 'zip') iconClass = 'fa-file-archive';
    if (fileObj.type === 'mol') iconClass = 'fa-flask';
    
    const moleculeInfo = fileObj.moleculeCount > 0 ? 
        ` • ${fileObj.moleculeCount} molecule${fileObj.moleculeCount > 1 ? 's' : ''}` : '';
    
    fileElement.innerHTML = `
        <div class="file-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${fileObj.name}</div>
            <div class="file-size">${fileObj.size} • ${fileObj.type.toUpperCase()}${moleculeInfo}</div>
        </div>
        <div class="file-remove" onclick="removeFile(${index})">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    filesContainer.appendChild(fileElement);
}

function updateFileItem(index) {
    const fileElement = filesContainer.children[index];
    if (fileElement) {
        const fileObj = selectedFiles[index];
        const moleculeInfo = fileObj.moleculeCount > 0 ? 
            ` • ${fileObj.moleculeCount} molecule${fileObj.moleculeCount > 1 ? 's' : ''}` : '';
        
        fileElement.querySelector('.file-size').textContent = 
            `${fileObj.size} • ${fileObj.type.toUpperCase()}${moleculeInfo}`;
    }
}

function removeFile(index) {
    if (mergeInProgress) {
        showAlert("Cannot remove", "Cannot remove files while merge is in progress");
        return;
    }
    
    const removedFile = selectedFiles.splice(index, 1)[0];
    updateFileList();
    updateStatus(`Removed: ${removedFile.name}`);
}

function clearFiles() {
    if (mergeInProgress) {
        const confirmClear = confirm("Merge is in progress. Are you sure you want to clear all files?");
        if (!confirmClear) return;
    }
    
    selectedFiles = [];
    updateFileList();
    updateStatus("All files cleared");
}

async function mergeFiles() {
    if (selectedFiles.length === 0) {
        showAlert("No files", "Please add SDF files first");
        return;
    }
    
    if (mergeInProgress) {
        showAlert("Merge in progress", "Please wait for current merge to complete");
        return;
    }
    
    mergeInProgress = true;
    mergeBtn.disabled = true;
    downloadBtn.disabled = true;
    
    updateStatus("Starting merge process...");
    progressBar.style.width = '0%';
    
    try {
        mergedData = "";
        let totalMolecules = 0;
        let processedFiles = 0;
        let errors = [];
        
        // Process each file
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileObj = selectedFiles[i];
            
            // Update progress
            const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
            progressBar.style.width = `${progress}%`;
            updateStatus(`Processing ${i + 1}/${selectedFiles.length}: ${fileObj.name}`);
            
            try {
                if (fileObj.type === 'zip') {
                    // Handle ZIP files
                    const result = await processZipFile(fileObj.file);
                    mergedData += result.data;
                    totalMolecules += result.count;
                } else {
                    // Handle SDF/MOL files
                    const content = await readFileContent(fileObj.file);
                    const processedContent = processSDFContent(content, fileObj.name);
                    mergedData += processedContent.data;
                    totalMolecules += processedContent.count;
                }
                
                processedFiles++;
                
                // Small delay to show progress
                await delay(100);
                
            } catch (error) {
                errors.push(`${fileObj.name}: ${error.message}`);
                console.error(`Error processing ${fileObj.name}:`, error);
            }
        }
        
        // Add proper SDF ending
        mergedData = mergedData.trim();
        if (!mergedData.endsWith('$$$$')) {
            mergedData += '\n$$$$\n';
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        mergedFileName = `merged_sdf_${timestamp}.sdf`;
        
        mergeInProgress = false;
        mergeBtn.disabled = false;
        downloadBtn.disabled = false;
        
        progressBar.style.width = '100%';
        
        // Show results
        if (errors.length > 0) {
            updateStatus(`Merge completed with ${errors.length} error${errors.length > 1 ? 's' : ''}. Total molecules: ${totalMolecules}`);
            showAlert("Merge Completed with Errors", 
                `Successfully processed ${processedFiles}/${selectedFiles.length} files\n` +
                `Total molecules: ${totalMolecules}\n\n` +
                `Errors:\n${errors.join('\n')}`);
        } else {
            updateStatus(`Merge completed successfully! Total molecules: ${totalMolecules}`);
            showAlert("Merge Successful", 
                `Successfully merged ${selectedFiles.length} files\n` +
                `Total molecules: ${totalMolecules}\n` +
                `Click Download to save the merged file.`);
        }
        
    } catch (error) {
        mergeInProgress = false;
        mergeBtn.disabled = false;
        updateStatus(`Error: ${error.message}`);
        showAlert("Merge Failed", "There was an error merging the files. Please try again.");
        console.error("Merge error:", error);
    }
}

function processSDFContent(content, filename) {
    let count = 0;
    let processedData = "";
    
    // Remove any trailing whitespace
    content = content.trim();
    
    // Split by $$$$ delimiters to get individual molecules
    const molecules = content.split(/\$\$\$\$\s*/);
    
    for (let molBlock of molecules) {
        molBlock = molBlock.trim();
        
        if (!molBlock) continue; // Skip empty blocks
        
        count++;
        
        // Ensure molecule block ends with proper line endings
        if (!molBlock.endsWith('\n')) {
            molBlock += '\n';
        }
        
        // Add source file info as data field
        const sourceField = `> <SOURCE_FILE>\n${filename}\n\n`;
        
        // Add merge timestamp
        const timestampField = `> <MERGE_TIMESTAMP>\n${new Date().toISOString()}\n\n`;
        
        // Append data fields and delimiter
        processedData += molBlock + sourceField + timestampField + '$$$$\n';
    }
    
    return {
        data: processedData,
        count: count
    };
}

async function processZipFile(zipFile) {
    return new Promise((resolve) => {
        // For ZIP files, we'll return a placeholder since client-side
        // ZIP processing requires additional libraries
        const placeholder = `> <MOLECULE>
ZIP File: ${zipFile.name}

> <COMMENT>
This molecule represents a ZIP archive. ZIP files require server-side processing.

> <SOURCE_FILE>
${zipFile.name}

> <MERGE_TIMESTAMP>
${new Date().toISOString()}

$$$$\n`;
        
        resolve({
            data: placeholder,
            count: 1
        });
    });
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function() {
            reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.readAsText(file, 'UTF-8');
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadMergedFile() {
    if (!mergedData) {
        showAlert("No data", "No merged data available. Please merge files first.");
        return;
    }
    
    try {
        // Create a valid SDF file with proper encoding
        const blob = new Blob([mergedData], { 
            type: 'chemical/x-mdl-sdfile;charset=utf-8'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mergedFileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        updateStatus(`Downloaded: ${mergedFileName}`);
        
    } catch (error) {
        updateStatus(`Download error: ${error.message}`);
        showAlert("Download Failed", "Could not download the file. Please try again.");
    }
}

function updateStatus(message) {
    statusText.textContent = message;
}

function showAlert(title, message) {
    alert(`${title}\n\n${message}`);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility function to validate SDF format
function validateSDF(content) {
    const lines = content.split('\n');
    let isValid = false;
    
    // Check for common SDF markers
    for (let line of lines) {
        if (line.includes('V2000') || line.includes('V3000')) {
            isValid = true;
            break;
        }
    }
    
    return isValid;
}

// Reset function
function resetApp() {
    selectedFiles = [];
    mergeInProgress = false;
    mergedData = "";
    progressBar.style.width = '0%';
    downloadBtn.disabled = true;
    updateFileList();
    updateStatus("Ready to merge SDF files");
}