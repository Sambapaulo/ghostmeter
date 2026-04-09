from manim import *
import random

# === CONFIGURATION ===
config.pixel_height = 1920
config.pixel_width = 1080
config.frame_rate = 30
config.background_color = "#140826"

# === COULEURS ===
COLOR_BG = "#140826"
COLOR_PRIMARY = "#a855f7"
COLOR_ALERT = "#ff3b5c"
COLOR_TIP = "#fbbf24"
COLOR_WHITE = "#ffffff"
COLOR_GRAY = "#cbd5e1"

class GhostMeterPromoOptimized(Scene):
    def construct(self):
        font = "Montserrat"

        self.hook(font)
        self.transition()

        self.problem_to_score(font)
        self.transition()

        self.generator(font)
        self.transition()

        self.cta(font)

    # === TRANSITION ===
    def transition(self):
        self.play(FadeOut(*self.mobjects), run_time=0.4)

    # === 1. HOOK (STOP SCROLL) ===
    def hook(self, font):
        text1 = Text("Il te ghost...", font=font, font_size=60, color=COLOR_WHITE)
        text2 = Text("et tu le sais même pas.", font=font, font_size=42, color=COLOR_ALERT)

        text2.next_to(text1, DOWN)

        self.play(FadeIn(text1, shift=UP*0.5), run_time=0.6)
        self.wait(0.3)
        self.play(FadeIn(text2), run_time=0.6)

        ghost = Text("👻", font_size=120)
        ghost.next_to(text2, DOWN, buff=0.5)

        self.play(ghost.animate.scale(1.3), run_time=0.3, rate_func=there_and_back)
        self.wait(0.5)

    # === 2. PROBLÈME → SCORE ===
    def problem_to_score(self, font):
        msg1 = Text("Vu ✔", font=font, font_size=40, color=COLOR_GRAY)
        msg2 = Text("En ligne...", font=font, font_size=40, color=COLOR_GRAY)
        msg3 = Text("...", font=font, font_size=60, color=COLOR_WHITE)

        group = VGroup(msg1, msg2, msg3).arrange(DOWN, buff=0.5)

        self.play(FadeIn(msg1))
        self.wait(0.4)
        self.play(FadeIn(msg2))
        self.wait(0.6)
        self.play(FadeIn(msg3))
        self.wait(0.5)

        self.play(FadeOut(group))

        title = Text("Analyse en cours...", font=font, font_size=42, color=COLOR_PRIMARY)
        self.play(FadeIn(title))

        self.wait(0.6)

        score = Text("25", font=font, font_size=120, color=COLOR_ALERT)

        self.play(Transform(title, Text("Score Ghosting", font=font, font_size=42, color=COLOR_GRAY)))

        self.play(FadeIn(score))
        self.play(score.animate.set_value(87), run_time=1.2, rate_func=rate_functions.ease_out_back)

        self.play(score.animate.scale(1.15), run_time=0.1)
        self.play(score.animate.scale(1/1.15), run_time=0.1)

        tip = Text("Il te ghost. Passe à autre chose.", font=font, font_size=28, color=COLOR_TIP)
        tip.next_to(score, DOWN, buff=0.5)

        self.play(FadeIn(tip, shift=UP*0.3))
        self.wait(1)

    # === 3. GÉNÉRATEUR ===
    def generator(self, font):
        title = Text("Réponds intelligemment", font=font, font_size=50, color=COLOR_PRIMARY)
        self.play(FadeIn(title))

        styles = [
            "Mystérieux 😏",
            "Direct",
            "Cool",
            "Sarcastique"
        ]

        style_group = VGroup(*[Text(s, font=font, font_size=30) for s in styles]).arrange(DOWN, buff=0.3)
        style_group.next_to(title, DOWN, buff=0.5)

        self.play(LaggedStart(*[FadeIn(s, shift=RIGHT) for s in style_group], lag_ratio=0.2))

        self.wait(0.5)

        response = Text("Hmm... intéressant 😏", font=font, font_size=36, color=COLOR_WHITE)
        response.next_to(style_group, DOWN, buff=0.8)

        self.play(AddTextLetterByLetter(response), run_time=1)
        self.wait(1)

    # === 4. CTA ===
    def cta(self, font):
        title = Text("Teste GhostMeter", font=font, font_size=60, color=COLOR_WHITE)
        sub = Text("Analyse tes conversations maintenant", font=font, font_size=32, color=COLOR_GRAY)

        sub.next_to(title, DOWN)

        btn = RoundedRectangle(width=4, height=1, corner_radius=0.3, fill_color=COLOR_PRIMARY, fill_opacity=1)
        btn_text = Text("ESSAYER", font=font, font_size=32, color=COLOR_WHITE)

        button = VGroup(btn, btn_text)
        button.next_to(sub, DOWN, buff=0.8)

        self.play(FadeIn(title))
        self.play(FadeIn(sub))
        self.play(FadeIn(button))

        self.play(button.animate.scale(0.9), run_time=0.1)
        self.play(button.animate.scale(1/0.9), run_time=0.1)

        self.wait(1.5)
