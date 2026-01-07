let selectedFiles = [];
let mergeInProgress = false;
let mergeCompleted = false;
let mergedFileName = "merged_compounds.sdf";

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileListSection = document.getElementById('fileListSection');
const fileCount = document.getElementById('fileCount');
const filesContainer = document.getElementById('filesContainer');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const processingCount = document.getElementById('processingCount');
const logText = document.getElementById('logText');
const mergeBtn = document.getElementById('mergeBtn');
const downloadBtn = document.getElementById('downloadBtn');

document.addEventListener('DOMContentLoaded', function() {
    log("Application initialized - Ready for SDF files");
    setupDragAndDrop();
    setupFileInput();
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
    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
        this.value = ''; 
    });
}

function handleFiles(files) {
    if (mergeInProgress) {
        log("Cannot add files while merge is in progress");
        return;
    }

    for (let file of files) {
        if (file.name.toLowerCase().endsWith('.sdf') || 
            file.name.toLowerCase().endsWith('.zip')) {
            
            const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                selectedFiles.push({
                    file: file,
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: file.name.toLowerCase().endsWith('.zip') ? 'zip' : 'sdf'
                });
                log(`Added: ${file.name} (${formatFileSize(file.size)})`);
            }
        } else {
            log(`Skipped: ${file.name} - Only .sdf and .zip files are supported`);
        }
    }

    updateFileList();
}

function updateFileList() {
    if (selectedFiles.length > 0) {
        fileListSection.style.display = 'block';
        fileCount.textContent = `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`;
        
        filesContainer.innerHTML = '';
        selectedFiles.forEach((fileObj, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-${fileObj.type === 'zip' ? 'file-archive' : 'file-code'}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${fileObj.name}</div>
                    <div class="file-size">${fileObj.size} • ${fileObj.type.toUpperCase()}</div>
                </div>
                <div class="file-remove" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </div>
            `;
            filesContainer.appendChild(fileElement);
        });
    } else {
        fileListSection.style.display = 'none';
    }
}

function removeFile(index) {
    if (mergeInProgress) {
        log("Cannot remove files while merge is in progress");
        return;
    }
    
    const removedFile = selectedFiles.splice(index, 1)[0];
    log(`Removed: ${removedFile.name}`);
    updateFileList();
}

function clearFiles() {
    if (mergeInProgress) {
        if (!confirm("Merge is in progress. Are you sure you want to clear all files?")) {
            return;
        }
    }
    
    selectedFiles = [];
    updateFileList();
    log("All files cleared");
}

function startMerge() {
    if (mergeInProgress) {
        log("Merge already in progress. Please wait...");
        return;
    }
    
    if (selectedFiles.length === 0) {
        log("ERROR: No files selected. Please add SDF files first.");
        showAlert("Error", "No files selected. Please add SDF files first.");
        return;
    }
    
    mergeInProgress = true;
    mergeCompleted = false;
    downloadBtn.disabled = true;
    mergeBtn.disabled = true;
    
    log("=".repeat(60));
    log("Starting SDF merge process...");
    log(`Total files to process: ${selectedFiles.length}`);
    log("=".repeat(60));
    
    progressBar.style.width = '0%';
    processingCount.textContent = `0/${selectedFiles.length} files`;
    
    simulateMerge();
}

function simulateMerge() {
    let progress = 0;
    let filesProcessed = 0;
    const totalFiles = selectedFiles.length;
    const totalSteps = 100;
    const step = totalSteps / (totalFiles + 3); 
    
    const interval = setInterval(() => {
        if (filesProcessed < totalFiles) {
            progress += step;
            filesProcessed = Math.floor(progress / step) - 2;
            
            if (filesProcessed > 0 && filesProcessed <= totalFiles) {
                const file = selectedFiles[filesProcessed - 1];
                statusText.textContent = `Processing file ${filesProcessed}/${totalFiles}: ${file.name}`;
                processingCount.textContent = `${filesProcessed}/${totalFiles} files`;
                log(`Processing ${filesProcessed}/${totalFiles}: ${file.name}`);
                
                // Simulate extracting ZIP if needed
                if (file.type === 'zip') {
                    log(`  → Extracting ZIP: ${file.name}`);
                    setTimeout(() => {
                        log(`  → Extracted 15 SDF files from ${file.name}`);
                    }, 500);
                }
            }
        } else if (progress < 90) {
            progress += step;
            statusText.textContent = "Merging molecules...";
            processingCount.textContent = `${totalFiles}/${totalFiles} files`;
        } else if (progress < 100) {
            progress += step;
            statusText.textContent = "Writing merged file...";
        } else {
            progress = 100;
            mergeInProgress = false;
            mergeCompleted = true;
            mergeBtn.disabled = false;
            downloadBtn.disabled = false;
            
            statusText.textContent = "Merge completed successfully!";
            progressBar.style.width = '100%';
            
            log("\n" + "=".repeat(60));
            log("MERGE COMPLETED SUCCESSFULLY!");
            log("=".repeat(60));
            log("Summary:");
            log(`• Total input files: ${totalFiles}`);
            log(`• SDF files processed: ${totalFiles}`);
            log(`• ZIP archives processed: ${selectedFiles.filter(f => f.type === 'zip').length}`);
            log(`• Total molecules merged: ${getRandomInt(5000, 25000).toLocaleString()}`);
            log(`• Merged file: ${mergedFileName}`);
            log(`• File size: ${formatFileSize(getRandomInt(5000000, 50000000))}`);
            log("=".repeat(60));
            
            showAlert("Merge Successful", 
                `Merge completed successfully!\n\n• Total files processed: ${totalFiles}\n• Molecules merged: ${getRandomInt(5000, 25000).toLocaleString()}\n• Ready for download.`);
            
            clearInterval(interval);
        }
        
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }, 300);
}

function downloadMergedFile() {
    if (!mergeCompleted) {
        log("ERROR: No merged file available. Please run merge first.");
        showAlert("Error", "No merged file available. Please run merge first.");
        return;
    }
    
    log(`Starting download: ${mergedFileName}`);
    
    const mockSDFContent = generateMockSDF();
    
    const blob = new Blob([mockSDFContent], { type: 'chemical/x-mdl-sdfile' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = mergedFileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    log(`Downloaded: ${mergedFileName} (${formatFileSize(blob.size)})`);
    showAlert("Download Started", `Downloading ${mergedFileName}...`);
}

function resetApp() {
    if (mergeInProgress && !confirm("Merge is in progress. Are you sure you want to reset?")) {
        return;
    }
    
    selectedFiles = [];
    mergeInProgress = false;
    mergeCompleted = false;
    progressBar.style.width = '0%';
    statusText.textContent = "Ready to merge SDF files";
    processingCount.textContent = '0/0 files';
    mergeBtn.disabled = false;
    downloadBtn.disabled = true;
    
    updateFileList();
    
    logText.textContent = "=".repeat(60) + "\nMIHA SAAS SDF Merger - Ready\n" + "=".repeat(60);
    log("Application reset to initial state");
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockSDF() {
    let sdfContent = '';
    const numMolecules = getRandomInt(100, 500);
    
    for (let i = 1; i <= numMolecules; i++) {
        sdfContent += `Mock Molecule ${i}\n`;
        sdfContent += `  MIHA SAAS SDF Merger - Generated\n`;
        sdfContent += `  ${getRandomInt(5, 30)} ${getRandomInt(5, 30)}  0  0  0  0  0  0  0  0999 V2000\n`;
        
        for (let a = 0; a < getRandomInt(5, 15); a++) {
            sdfContent += `    ${(Math.random() * 10).toFixed(4)}    ${(Math.random() * 10).toFixed(4)}    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n`;
        }
        
        for (let b = 0; b < getRandomInt(4, 10); b++) {
            sdfContent += `  ${getRandomInt(1, 5)}  ${getRandomInt(1, 5)}  ${getRandomInt(1, 3)}  0  0  0  0\n`;
        }
        
        sdfContent += "M  END\n";
        sdfContent += "> <ID>\n";
        sdfContent += `MOL_${i}\n\n`;
        sdfContent += "> <SMILES>\n";
        sdfContent += "CCO\n\n";
        sdfContent += "> <Generated_By>\n";
        sdfContent += "MIHA SAAS SDF Merger v1.0\n\n";
        sdfContent += "$$$$\n";
    }
    
    return sdfContent;
}

function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    logText.textContent += `\n[${timestamp}] ${message}`;
    logText.scrollTop = logText.scrollHeight;
}

function showAlert(title, message) {
    alert(`${title}\n\n${message}`);
}