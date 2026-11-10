//! StackLens CLI — Command Line Android Application Intelligence

use std::path::PathBuf;
use std::process::exit;

use clap::{Args, Parser, Subcommand, ValueEnum};
use stacklens_engine::{analyze_apk, reporting};

#[derive(Parser)]
#[command(
    name = "stacklens",
    author = "StackLens Team",
    version = "0.1.0",
    about = "Android Application Intelligence — Discover. Analyze. Understand.",
    long_about = "StackLens inspects Android APK files, identifies underlying application frameworks, catalogs native libraries, and extracts structural evidence."
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Inspect an APK file and detect applied frameworks
    Analyze(AnalyzeArgs),
    /// Display StackLens metadata and supported frameworks
    Info,
}

#[derive(Args)]
struct AnalyzeArgs {
    /// Path to the APK file to inspect
    #[arg(value_name = "APK_PATH")]
    apk_path: PathBuf,

    /// Output report format
    #[arg(short, long, value_enum, default_value_t = OutputFormat::Txt)]
    format: OutputFormat,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ValueEnum)]
enum OutputFormat {
    Json,
    Csv,
    Txt,
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Analyze(args) => {
            if !args.apk_path.exists() {
                eprintln!("Error: APK file does not exist: {}", args.apk_path.display());
                exit(1);
            }

            match analyze_apk(&args.apk_path, None) {
                Ok(result) => match args.format {
                    OutputFormat::Json => {
                        let json = reporting::json::to_json(&result).unwrap_or_default();
                        println!("{json}");
                    }
                    OutputFormat::Csv => {
                        let csv = reporting::csv::to_csv(&result);
                        println!("{csv}");
                    }
                    OutputFormat::Txt => {
                        let txt = reporting::txt::to_text_report(&result);
                        println!("{txt}");
                    }
                },
                Err(e) => {
                    eprintln!("Error analyzing APK: {e}");
                    exit(1);
                }
            }
        }
        Commands::Info => {
            println!("StackLens — Android Application Intelligence");
            println!("Version: 0.1.0");
            println!("Application ID: com.stacklens.desktop");
            println!("Tagline: Discover. Analyze. Understand.");
            println!("\nSupported Frameworks:");
            println!("  1. Flutter");
            println!("  2. React Native");
            println!("  3. Native Android (Java)");
            println!("  4. Native Android (Kotlin)");
            println!("  5. Unity");
            println!("  6. Xamarin");
            println!("  7. .NET MAUI");
            println!("  8. Apache Cordova");
            println!("  9. Capacitor");
            println!(" 10. Ionic");
            println!(" 11. NativeScript");
            println!(" 12. Unreal Engine");
            println!(" 13. Godot");
            println!(" 14. Jetpack Compose (indicator)");
        }
    }
}
