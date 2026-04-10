import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
from moviepy import VideoFileClip, AudioFileClip, CompositeAudioClip

def generate_voiceovers():
    print("Generating voiceovers...")
    texts = [
        ("voice1.aiff", "Benvenuti nel nuovo sito ufficiale di Fusion Team Volley. Un design innovativo, dinamico e d'impatto."),
        ("voice2.aiff", "Scoprite le nostre squadre, i roster e i talenti che scendono in campo ogni giorno."),
        ("voice3.aiff", "Entrate nel nostro Club. Una famiglia unita dalla passione per la pallavolo. Vi aspettiamo!")
    ]
    
    for filename, text in texts:
        subprocess.run(["say", "-v", "Luca", text, "-o", filename])

async def record_video():
    print("Recording video with Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=".",
            record_video_size={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        print("Navigating to Home...")
        await page.goto("https://www.fusionteamvolley.it/")
        await page.wait_for_timeout(3000)
        
        # Scroll slowly down the homepage
        for _ in range(5):
            await page.mouse.wheel(0, 800)
            await page.wait_for_timeout(1500)
            
        print("Navigating to Le Squadre...")
        # Click on Le Squadre
        await page.click("text=Le Squadre")
        await page.wait_for_timeout(3000)
        
        for _ in range(3):
            await page.mouse.wheel(0, 800)
            await page.wait_for_timeout(1500)
            
        print("Navigating to Il Club...")
        await page.click("text=Il Club")
        await page.wait_for_timeout(3000)
        
        for _ in range(3):
            await page.mouse.wheel(0, 800)
            await page.wait_for_timeout(1500)
            
        await context.close()
        video_path = await page.video.path()
        await browser.close()
        return video_path

def combine_media(video_path, music_path):
    print(f"Combining media... Video: {video_path}")
    video = VideoFileClip(video_path)
    
    # Load voiceovers
    v1 = AudioFileClip("voice1.aiff").set_start(2)
    v2 = AudioFileClip("voice2.aiff").set_start(12)
    v3 = AudioFileClip("voice3.aiff").set_start(22)
    
    # Load background music and loop it if necessary, lower volume
    music = AudioFileClip(music_path).fx(lambda x: x.volumex(0.3)).set_duration(video.duration)
    
    # Combine audio
    final_audio = CompositeAudioClip([music, v1, v2, v3])
    
    # Set audio to video
    final_video = video.set_audio(final_audio)
    
    output_filename = "presentation_desktop_wow.mp4"
    final_video.write_videofile(output_filename, fps=30, codec="libx264", audio_codec="aac")
    print(f"Video saved to {output_filename}")
    return output_filename

async def main():
    generate_voiceovers()
    
    # Ensure yt-dlp is installed and download a royalty-free track
    print("Downloading background music...")
    subprocess.run([
        "yt-dlp",
        "-x", "--audio-format", "mp3",
        "--output", "bg_music.%(ext)s",
        "https://www.youtube.com/watch?v=n1ddqXIbpa8" # A generic chill/wow electronic track (NoCopyrightSounds)
    ])
    
    raw_video_path = await record_video()
    
    combine_media(raw_video_path, "bg_music.mp3")

if __name__ == "__main__":
    asyncio.run(main())
