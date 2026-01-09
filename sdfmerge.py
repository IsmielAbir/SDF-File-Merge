import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import os
import glob
import threading
from rdkit import Chem
from rdkit.Chem import SDWriter

class SDFMergerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("MIHA SAAS SDF Merger")
        self.root.geometry("800x600")
        self.root.configure(bg="#f0f0f0")
        
        self.set_window_icon()
        
        self.input_folder = tk.StringVar()
        self.output_file = tk.StringVar()
        self.status_var = tk.StringVar(value="Ready to merge SDF files")
        
        self.create_widgets()
        self.center_window()
    
    def set_window_icon(self):
        icon_files = ['abs2vex.ico', 'logo.ico', 'abs2vex.png', 'logo.png', 'abs2vex_logo.ico', 'abs2vex_logo.png']
        for icon_file in icon_files:
            if os.path.exists(icon_file):
                try:
                    self.root.iconbitmap(icon_file)
                    print(f"Icon set from: {icon_file}")
                    break
                except Exception as e:
                    print(f"Could not set icon from {icon_file}: {e}")
                    continue
    
    def center_window(self):
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def create_widgets(self):
        main_frame = tk.Frame(self.root, bg="#f0f0f0")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        header_frame = tk.Frame(main_frame, bg="#f0f0f0")
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        branding_frame = tk.Frame(header_frame, bg="#f0f0f0")
        branding_frame.pack(side=tk.LEFT)
        
        company_label = tk.Label(
            branding_frame,
            text="MIHA SAAS",
            font=("Arial", 24, "bold"),
            bg="#f0f0f0",
            fg="#2c3e50"
        )
        company_label.pack(anchor=tk.W)
        
        company_subtitle = tk.Label(
            branding_frame,
            text="For Nous",
            font=("Arial", 10, "italic"),
            bg="#f0f0f0",
            fg="#3498db"
        )
        company_subtitle.pack(anchor=tk.W, pady=(2, 0))
        
        app_title_frame = tk.Frame(header_frame, bg="#f0f0f0")
        app_title_frame.pack(side=tk.RIGHT, pady=(5, 0))
        
        app_title = tk.Label(
            app_title_frame,
            text="SDF File Merger",
            font=("Arial", 18, "bold"),
            bg="#f0f0f0",
            fg="#2c3e50"
        )
        app_title.pack(anchor=tk.E)
        
        app_version = tk.Label(
            app_title_frame,
            text="v1.0",
            font=("Arial", 9),
            bg="#f0f0f0",
            fg="#7f8c8d"
        )
        app_version.pack(anchor=tk.E, pady=(2, 0))
        
        separator = tk.Frame(main_frame, height=2, bg="#bdc3c7")
        separator.pack(fill=tk.X, pady=(0, 20))
        
        input_frame = tk.LabelFrame(
            main_frame,
            text="Step 1: Select Folder with SDF Files",
            font=("Arial", 10, "bold"),
            bg="#f0f0f0",
            padx=15,
            pady=15
        )
        input_frame.pack(fill=tk.X, pady=(0, 15))
        
        input_inner_frame = tk.Frame(input_frame, bg="#f0f0f0")
        input_inner_frame.pack(fill=tk.X)
        
        self.input_entry = tk.Entry(
            input_inner_frame,
            textvariable=self.input_folder,
            font=("Arial", 10),
            width=60,
            state='readonly',
            readonlybackground='white'
        )
        self.input_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_input_btn = tk.Button(
            input_inner_frame,
            text="Browse Folder",
            command=self.browse_input_folder,
            bg="#3498db",
            fg="white",
            font=("Arial", 9, "bold"),
            relief=tk.FLAT,
            padx=15,
            cursor="hand2"
        )
        browse_input_btn.pack(side=tk.RIGHT)
        
        output_frame = tk.LabelFrame(
            main_frame,
            text="Step 2: Select Output File Location",
            font=("Arial", 10, "bold"),
            bg="#f0f0f0",
            padx=15,
            pady=15
        )
        output_frame.pack(fill=tk.X, pady=(0, 15))
        
        output_inner_frame = tk.Frame(output_frame, bg="#f0f0f0")
        output_inner_frame.pack(fill=tk.X)
        
        self.output_entry = tk.Entry(
            output_inner_frame,
            textvariable=self.output_file,
            font=("Arial", 10),
            width=60,
            state='readonly',
            readonlybackground='white'
        )
        self.output_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_output_btn = tk.Button(
            output_inner_frame,
            text="Save As",
            command=self.browse_output_file,
            bg="#2ecc71",
            fg="white",
            font=("Arial", 9, "bold"),
            relief=tk.FLAT,
            padx=15,
            cursor="hand2"
        )
        browse_output_btn.pack(side=tk.RIGHT)
        
        progress_frame = tk.Frame(main_frame, bg="#f0f0f0")
        progress_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            variable=self.progress_var,
            maximum=100,
            mode='determinate',
            length=740
        )
        self.progress_bar.pack(fill=tk.X)
        
        self.status_label = tk.Label(
            main_frame,
            textvariable=self.status_var,
            font=("Arial", 9),
            bg="#f0f0f0",
            fg="#2c3e50"
        )
        self.status_label.pack(pady=(0, 20))
        
        button_frame = tk.Frame(main_frame, bg="#f0f0f0")
        button_frame.pack()
        
        merge_btn = tk.Button(
            button_frame,
            text="Merge SDF Files",
            command=self.start_merge,
            bg="#9b59b6",
            fg="white",
            font=("Arial", 11, "bold"),
            relief=tk.FLAT,
            padx=30,
            pady=10,
            cursor="hand2"
        )
        merge_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        exit_btn = tk.Button(
            button_frame,
            text="Exit",
            command=self.root.quit,
            bg="#e74c3c",
            fg="white",
            font=("Arial", 11),
            relief=tk.FLAT,
            padx=30,
            pady=10,
            cursor="hand2"
        )
        exit_btn.pack(side=tk.LEFT)
        
        self.log_text = tk.Text(
            main_frame,
            height=8,
            font=("Consolas", 9),
            bg="#2c3e50",
            fg="#ecf0f1",
            relief=tk.FLAT
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, pady=(20, 0))
        
        scrollbar = tk.Scrollbar(self.log_text)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_text.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.log_text.yview)
        
        footer_frame = tk.Frame(main_frame, bg="#f0f0f0")
        footer_frame.pack(fill=tk.X, pady=(15, 0))
        
        footer_separator = tk.Frame(footer_frame, height=1, bg="#bdc3c7")
        footer_separator.pack(fill=tk.X, pady=(0, 10))
        
        footer_text = tk.Label(
            footer_frame,
            text="© 2024 ABS2VEX Software Company | Professional Molecular Data Tools",
            font=("Arial", 8),
            bg="#f0f0f0",
            fg="#7f8c8d"
        )
        footer_text.pack()
    
    def browse_input_folder(self):
        folder = filedialog.askdirectory(title="Select Folder with SDF Files")
        if folder:
            self.input_folder.set(folder)
            self.log(f"Input folder selected: {folder}")
    
    def browse_output_file(self):
        file_path = filedialog.asksaveasfilename(
            title="Save Merged SDF File",
            defaultextension=".sdf",
            filetypes=[("SDF Files", "*.sdf"), ("All Files", "*.*")]
        )
        if file_path:
            self.output_file.set(file_path)
            self.log(f"Output file set to: {file_path}")
    
    def log(self, message):
        self.log_text.insert(tk.END, f"{message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
    
    def update_progress(self, value, message=None):
        self.progress_var.set(value)
        if message:
            self.status_var.set(message)
            self.log(message)
        self.root.update_idletasks()
    
    def find_sdf_files(self, folder):
        sdf_files = []
        pattern = "*.sdf"
        
        for file_path in glob.glob(os.path.join(folder, pattern)):
            if file_path.lower().endswith('.sdf'):
                sdf_files.append(file_path)
        
        return sdf_files
    
    def merge_sdf_files(self):
        input_folder = self.input_folder.get()
        output_file = self.output_file.get()
        
        if not input_folder or not os.path.exists(input_folder):
            messagebox.showerror("Error", "Please select a valid input folder")
            return
        
        if not output_file:
            messagebox.showerror("Error", "Please select an output file location")
            return
        
        self.update_progress(0, "Searching for SDF files...")
        
        sdf_files = self.find_sdf_files(input_folder)
        
        if not sdf_files:
            messagebox.showerror("Error", f"No SDF files found in: {input_folder}")
            self.update_progress(0, "No SDF files found")
            return
        
        total_files = len(sdf_files)
        self.log(f"Found {total_files} SDF files to merge")
        
        try:
            writer = SDWriter(output_file)
            total_molecules = 0
            error_count = 0
            
            for i, sdf_file in enumerate(sdf_files):
                progress = (i + 1) / total_files * 100
                self.update_progress(
                    progress,
                    f"Processing file {i+1}/{total_files}: {os.path.basename(sdf_file)}"
                )
                
                try:
                    supplier = Chem.SDMolSupplier(sdf_file)
                    file_molecules = 0
                    
                    for mol in supplier:
                        if mol is not None:
                            writer.write(mol)
                            total_molecules += 1
                            file_molecules += 1
                        else:
                            error_count += 1
                    
                    self.log(f"  → {file_molecules} molecules from {os.path.basename(sdf_file)}")
                    
                except Exception as e:
                    self.log(f"  → Error reading {sdf_file}: {str(e)}")
                    error_count += 1
                    continue
            
            writer.close()
            
            self.update_progress(100, "Merge completed successfully!")
            
            result_message = (
                f"Merge completed!\n\n"
                f"• Input folder: {input_folder}\n"
                f"• SDF files processed: {total_files}\n"
                f"• Total molecules merged: {total_molecules}\n"
                f"• Output file: {output_file}\n"
                f"• File size: {os.path.getsize(output_file):,} bytes\n"
                f"• Errors encountered: {error_count}"
            )
            
            self.log("\n" + "="*60)
            self.log("MERGE SUMMARY:")
            self.log(f"Total SDF files: {total_files}")
            self.log(f"Total molecules: {total_molecules}")
            self.log(f"Errors: {error_count}")
            self.log(f"Output: {output_file}")
            
            messagebox.showinfo("Merge Successful", result_message)
            
        except Exception as e:
            error_msg = f"Error during merge: {str(e)}"
            self.log(f"ERROR: {error_msg}")
            messagebox.showerror("Merge Failed", error_msg)
            self.update_progress(0, "Merge failed")
    
    def start_merge(self):
        if not self.input_folder.get():
            messagebox.showerror("Error", "Please select an input folder first")
            return
        
        if not self.output_file.get():
            messagebox.showerror("Error", "Please select an output file location")
            return
        
        self.log_text.delete(1.0, tk.END)
        self.log("="*60)
        self.log("Starting SDF merge process...")
        self.log(f"Input folder: {self.input_folder.get()}")
        self.log(f"Output file: {self.output_file.get()}")
        self.log("="*60)
        
        merge_thread = threading.Thread(target=self.merge_sdf_files, daemon=True)
        merge_thread.start()

def main():
    root = tk.Tk()
    app = SDFMergerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()