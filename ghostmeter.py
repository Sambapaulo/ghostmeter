from manim import *

# === CONFIGURATION VIDÉO ===
config.pixel_height = 1920
config.pixel_width = 1080
config.frame_rate = 30
config.background_color = "#1a0a2e"

# === COULEURS ===
COLOR_BG = "#1a0a2e"
COLOR_BG_LIGHT = "#2d1b4e"
COLOR_PRIMARY = "#a855f7"
COLOR_PRIMARY_DARK = "#4c1d95"
COLOR_ALERT = "#f43f5e"
COLOR_TIP = "#fbbf24"
COLOR_WHITE = "#ffffff"
COLOR_GRAY = "#9ca3af"
COLOR_GRAY_LIGHT = "#d1d5db"
COLOR_RECEIVED = "#3b2d5e"


class AnimatedNumber(VGroup):
    """Nombre animé sans LaTeX"""
    def __init__(self, start=0, font_size=60, color=COLOR_WHITE, font="Arial", **kwargs):
        super().__init__(**kwargs)
        self.current_value = start
        self.font_size = font_size
        self.color = color
        self.font = font
        self.text = Text(str(start), font=font, font_size=font_size, color=color)
        self.add(self.text)
    
    def set_value(self, value):
        new_text = Text(str(int(value)), font=self.font, font_size=self.font_size, color=self.color)
        new_text.move_to(self.text.get_center())
        self.remove(self.text)
        self.add(new_text)
        self.text = new_text
        self.current_value = value
        return self


class GhostMeterApp(Scene):
    """Script fidèle à l'application GhostMeter"""
    
    def construct(self):
        self.font = "Arial"
        
        # === INTRO ===
        self.intro()
        self.transition()
        
        # === ANALYSE DE CONVERSATION ===
        self.analyse_section()
        self.transition()
        
        # === GÉNÉRATEUR DE RÉPONSES ===
        self.generator_section()
        self.transition()
        
        # === COACH RELATIONNEL ===
        self.coach_section()
        self.transition()
        
        # === CTA ===
        self.cta_section()
    
    def transition(self):
        if self.mobjects:
            self.play(FadeOut(*self.mobjects), run_time=0.4)
    
    # === 1. INTRO ===
    def intro(self):
        # Logo GhostMeter
        ghost = self.create_ghost_logo()
        ghost.scale(2.5)
        
        # Titre
        title = Text("GhostMeter", font=self.font, font_size=70, color=COLOR_WHITE)
        title.next_to(ghost, DOWN, buff=0.4)
        
        # Ligne décorative
        line = Line(LEFT * 1.5, RIGHT * 1.5, color=COLOR_PRIMARY, stroke_width=4)
        line.next_to(title, DOWN, buff=0.3)
        
        # Tagline
        tagline = Text("Détecteur de Ghosting", font=self.font, font_size=30, color=COLOR_PRIMARY)
        tagline.next_to(line, DOWN, buff=0.3)
        
        # Animation
        self.play(FadeIn(ghost, scale=0.5), run_time=0.6)
        self.play(FadeIn(title, shift=UP*0.2), run_time=0.5)
        self.play(Create(line), run_time=0.3)
        self.play(FadeIn(tagline), run_time=0.4)
        self.wait(0.5)
    
    def create_ghost_logo(self):
        """Crée le logo fantôme fidèle à l'app"""
        # Corps du fantôme
        body = self.create_ghost_body()
        
        # Yeux
        left_eye_white = Ellipse(width=0.3, height=0.4, color=COLOR_WHITE, fill_opacity=1)
        left_eye_white.move_to(UP * 0.15 + LEFT * 0.25)
        
        right_eye_white = Ellipse(width=0.3, height=0.4, color=COLOR_WHITE, fill_opacity=1)
        right_eye_white.move_to(UP * 0.15 + RIGHT * 0.25)
        
        left_pupil = Dot(point=UP * 0.12 + LEFT * 0.22, radius=0.08, color=COLOR_BG)
        right_pupil = Dot(point=UP * 0.12 + RIGHT * 0.28, radius=0.08, color=COLOR_BG)
        
        # Joues
        left_cheek = Ellipse(width=0.2, height=0.1, color="#f472b6", fill_opacity=0.5)
        left_cheek.move_to(LEFT * 0.5 + DOWN * 0.1)
        
        right_cheek = Ellipse(width=0.2, height=0.1, color="#f472b6", fill_opacity=0.5)
        right_cheek.move_to(RIGHT * 0.5 + DOWN * 0.1)
        
        # Sourire
        smile = Arc(radius=0.15, start_angle=PI, angle=-PI, color=COLOR_BG, stroke_width=4)
        smile.move_to(DOWN * 0.25)
        
        ghost = VGroup(body, left_eye_white, right_eye_white, left_pupil, right_pupil, left_cheek, right_cheek, smile)
        return ghost
    
    def create_ghost_body(self):
        """Crée le corps du fantôme"""
        body = VMobject()
        
        points = [
            UP * 1.2,
            UP * 1.1 + RIGHT * 0.4,
            UP * 0.8 + RIGHT * 0.6,
            RIGHT * 0.7,
            DOWN * 0.3 + RIGHT * 0.65,
            DOWN * 0.6 + RIGHT * 0.55,
            DOWN * 0.8 + RIGHT * 0.4,
            DOWN * 1 + RIGHT * 0.25,
            DOWN * 0.85 + RIGHT * 0.1,
            DOWN * 0.95,
            DOWN * 0.85 + LEFT * 0.1,
            DOWN * 1 + LEFT * 0.25,
            DOWN * 0.8 + LEFT * 0.4,
            DOWN * 0.6 + LEFT * 0.55,
            DOWN * 0.3 + LEFT * 0.65,
            LEFT * 0.7,
            UP * 0.8 + LEFT * 0.6,
            UP * 1.1 + LEFT * 0.4,
        ]
        
        body.set_points_smoothly([*points, points[0]])
        body.set_fill(color=COLOR_PRIMARY, opacity=1)
        body.set_stroke(width=0)
        
        return body
    
    # === 2. ANALYSE DE CONVERSATION ===
    def analyse_section(self):
        # Titre
        title = Text("Analyse", font=self.font, font_size=50, color=COLOR_PRIMARY)
        title.to_edge(UP, buff=0.8)
        
        # Étapes
        steps = VGroup(
            self.create_step("1", "Colle la conversation"),
            self.create_step("2", "Appuie sur Analyser"),
            self.create_step("3", "Score Ghosting 85%")
        )
        steps.arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        steps.next_to(title, DOWN, buff=0.6)
        steps.move_to(ORIGIN)
        
        self.play(FadeIn(title))
        for step in steps:
            self.play(FadeIn(step, shift=RIGHT*0.3), run_time=0.4)
        
        self.wait(0.5)
        self.play(FadeOut(title, steps))
        
        # === PHONE MOCKUP ===
        phone = self.create_phone_analyse()
        self.play(FadeIn(phone), run_time=0.5)
        self.wait(0.3)
        
        # Animation du score
        score_value = phone[3]  # Score text
        self.animate_score(score_value, 85)
        
        # Tip
        tip = phone[4]
        self.play(FadeIn(tip, shift=UP*0.2), run_time=0.3)
        
        self.wait(0.8)
    
    def create_step(self, number, text):
        """Crée une étape numérotée"""
        circle = Circle(radius=0.35, color=COLOR_PRIMARY, fill_opacity=1)
        num = Text(number, font=self.font, font_size=24, color=COLOR_WHITE)
        num.move_to(circle)
        
        label = Text(text, font=self.font, font_size=26, color=COLOR_WHITE)
        label.next_to(circle, RIGHT, buff=0.3)
        
        return VGroup(circle, num, label)
    
    def create_phone_analyse(self):
        """Crée le mockup téléphone pour l'analyse"""
        # Cadre téléphone
        phone_frame = RoundedRectangle(
            width=4.5, height=5,
            corner_radius=0.3,
            fill_color=COLOR_BG_LIGHT,
            fill_opacity=1,
            stroke_color=COLOR_PRIMARY_DARK,
            stroke_width=3
        )
        
        # Header
        header = Rectangle(width=4.5, height=0.7, fill_color=COLOR_PRIMARY_DARK, fill_opacity=1, stroke_width=0)
        header.align_to(phone_frame, UP)
        header_title = Text("Analyse Ghosting", font=self.font, font_size=20, color=COLOR_WHITE)
        header_title.move_to(header)
        
        # Section Score
        score_bg = Rectangle(width=4.5, height=2, fill_color=COLOR_PRIMARY_DARK, fill_opacity=1, stroke_width=0)
        score_bg.align_to(phone_frame, DOWN)
        
        score_label = Text("Ghosting Score", font=self.font, font_size=16, color=COLOR_GRAY_LIGHT)
        score_label.move_to(score_bg.get_center() + UP * 0.5)
        
        score_value = Text("0%", font=self.font, font_size=50, color=COLOR_ALERT)
        score_value.move_to(score_bg.get_center())
        
        tip = Text("Il te ghost... Passe à autre chose !", font=self.font, font_size=12, color=COLOR_TIP)
        tip.next_to(score_value, DOWN, buff=0.2)
        
        return VGroup(phone_frame, VGroup(header, header_title), VGroup(score_bg, score_label), score_value, tip)
    
    def animate_score(self, score_text, target):
        """Anime le score de 0 à target"""
        for i in range(0, target + 1, 5):
            new_text = Text(f"{i}%", font=self.font, font_size=50, color=COLOR_ALERT)
            new_text.move_to(score_text.get_center())
            self.remove(score_text)
            self.add(new_text)
            score_text = new_text
            self.wait(0.03)
        # Valeur finale exacte
        final_text = Text(f"{target}%", font=self.font, font_size=50, color=COLOR_ALERT)
        final_text.move_to(score_text.get_center())
        self.remove(score_text)
        self.add(final_text)
    
    # === 3. GÉNÉRATEUR DE RÉPONSES ===
    def generator_section(self):
        # Titre
        title = Text("Generateur", font=self.font, font_size=50, color=COLOR_PRIMARY)
        title.to_edge(UP, buff=0.8)
        
        # Styles de réponse
        styles_data = [
            ("Mystérieux & Coquin", True),
            ("Direct & Honnete", False),
            ("Nonchalant & Cool", False)
        ]
        
        style_cards = VGroup()
        for style_name, is_selected in styles_data:
            card = self.create_style_card(style_name, is_selected)
            style_cards.add(card)
        
        style_cards.arrange(DOWN, buff=0.15)
        style_cards.next_to(title, DOWN, buff=0.5)
        
        self.play(FadeIn(title))
        self.play(LaggedStart(*[FadeIn(card, shift=RIGHT*0.3) for card in style_cards], lag_ratio=0.15))
        self.wait(0.5)
        
        # Réponses
        self.play(FadeOut(title, style_cards))
        
        responses = VGroup(
            self.create_response_card("1", "Hmm, occupe... Interressant"),
            self.create_response_card("2", "Tu me dois une explication..."),
            self.create_response_card("3", "J'espere que c'etait worth it")
        )
        responses.arrange(DOWN, buff=0.2)
        
        for resp in responses:
            self.play(FadeIn(resp, shift=UP*0.2), run_time=0.3)
        
        self.wait(0.8)
    
    def create_style_card(self, text, is_selected):
        """Crée une carte de style"""
        width = 5
        height = 0.6
        
        if is_selected:
            card = RoundedRectangle(
                width=width, height=height,
                corner_radius=0.15,
                fill_color=COLOR_PRIMARY,
                fill_opacity=1,
                stroke_width=0
            )
            text_color = COLOR_WHITE
        else:
            card = RoundedRectangle(
                width=width, height=height,
                corner_radius=0.15,
                fill_color=COLOR_BG_LIGHT,
                fill_opacity=1,
                stroke_width=0
            )
            text_color = COLOR_GRAY
        
        label = Text(text, font=self.font, font_size=18, color=text_color)
        label.move_to(card)
        
        return VGroup(card, label)
    
    def create_response_card(self, num, text):
        """Crée une carte de réponse"""
        card = RoundedRectangle(
            width=5, height=0.7,
            corner_radius=0.1,
            fill_color=COLOR_RECEIVED,
            fill_opacity=1,
            stroke_width=0
        )
        
        border = Line(UP * 0.35, DOWN * 0.35, color=COLOR_PRIMARY, stroke_width=3)
        border.align_to(card, LEFT).shift(RIGHT * 0.05)
        
        label = Text(f"Proposition {num}", font=self.font, font_size=12, color=COLOR_PRIMARY)
        label.align_to(card, UP).shift(DOWN * 0.1 + LEFT * 0.4)
        
        resp_text = Text(text, font=self.font, font_size=14, color=COLOR_WHITE)
        resp_text.next_to(label, DOWN, buff=0.05)
        
        return VGroup(card, border, label, resp_text)
    
    # === 4. COACH RELATIONNEL ===
    def coach_section(self):
        # Titre
        title = Text("Coach Relationnel", font=self.font, font_size=45, color=COLOR_ALERT)
        title.to_edge(UP, buff=0.6)
        
        # Avatar coach
        avatar_bg = Circle(radius=0.6, color=COLOR_PRIMARY, fill_opacity=1)
        avatar_emoji = Text("!", font=self.font, font_size=40, color=COLOR_WHITE)
        avatar_emoji.move_to(avatar_bg)
        avatar = VGroup(avatar_bg, avatar_emoji)
        
        # Bulle
        bubble = RoundedRectangle(
            width=5, height=1.2,
            corner_radius=0.3,
            fill_color=COLOR_BG_LIGHT,
            fill_opacity=1,
            stroke_color=COLOR_PRIMARY,
            stroke_width=2
        )
        bubble.next_to(avatar, DOWN, buff=0.2)
        
        coach_msg = Text("Je t'aide a comprendre\nses comportements", font=self.font, font_size=16, color=COLOR_WHITE)
        coach_msg.move_to(bubble)
        
        # Conseils
        tips = VGroup(
            self.create_tip_card("Conseil du jour", "S'il ne fait aucun effort...", COLOR_TIP),
            self.create_tip_card("Prochaine etape", "Passe en mode miroir", COLOR_PRIMARY),
            self.create_tip_card("Affirmation", "Je merite qu'on me reponde", COLOR_ALERT)
        )
        tips.arrange(DOWN, buff=0.15)
        tips.next_to(bubble, DOWN, buff=0.3)
        
        # Animations
        self.play(FadeIn(title))
        self.play(FadeIn(avatar, scale=0.5))
        self.play(Create(bubble))
        self.play(FadeIn(coach_msg))
        
        for tip in tips:
            self.play(FadeIn(tip, shift=UP*0.2), run_time=0.25)
        
        self.wait(0.8)
    
    def create_tip_card(self, title, text, color):
        """Crée une carte de conseil"""
        card = RoundedRectangle(
            width=5, height=0.65,
            corner_radius=0.15,
            fill_color=COLOR_BG_LIGHT,
            fill_opacity=1,
            stroke_width=0
        )
        
        border = Rectangle(width=0.06, height=0.65, fill_color=color, fill_opacity=1, stroke_width=0)
        border.align_to(card, LEFT)
        
        title_text = Text(title, font=self.font, font_size=12, color=color, weight=BOLD)
        title_text.align_to(card, UP).shift(DOWN * 0.1 + RIGHT * 0.25)
        
        desc_text = Text(text, font=self.font, font_size=11, color=COLOR_GRAY_LIGHT)
        desc_text.next_to(title_text, DOWN, buff=0.03)
        
        return VGroup(card, border, title_text, desc_text)
    
    # === 5. CTA ===
    def cta_section(self):
        # Logo
        ghost = self.create_ghost_logo()
        ghost.scale(1.8)
        
        # Titre
        title = Text("GhostMeter", font=self.font, font_size=55, color=COLOR_WHITE)
        title.next_to(ghost, DOWN, buff=0.3)
        
        # Sous-titre
        subtitle = Text("Detecteur de Ghosting Intelligent", font=self.font, font_size=24, color=COLOR_PRIMARY)
        subtitle.next_to(title, DOWN, buff=0.2)
        
        # Features
        features = VGroup(
            self.create_feature("Analyse en temps reel"),
            self.create_feature("Reponses optimisees"),
            self.create_feature("Coach relationnel")
        )
        features.arrange(DOWN, buff=0.12)
        features.next_to(subtitle, DOWN, buff=0.4)
        
        # Bouton CTA
        btn = RoundedRectangle(
            width=4.5, height=0.8,
            corner_radius=0.35,
            fill_color=COLOR_PRIMARY,
            fill_opacity=1,
            stroke_width=0
        )
        btn_text = Text("Telecharger l'App", font=self.font, font_size=22, color=COLOR_WHITE)
        btn_text.move_to(btn)
        button = VGroup(btn, btn_text)
        button.next_to(features, DOWN, buff=0.4)
        
        # Animations
        self.play(FadeIn(ghost, scale=0.5))
        self.play(ghost.animate.scale(1.1), rate_func=there_and_back, run_time=0.3)
        self.play(FadeIn(title))
        self.play(FadeIn(subtitle))
        
        for feature in features:
            self.play(FadeIn(feature), run_time=0.15)
        
        self.play(FadeIn(button))
        self.play(button.animate.scale(0.95), rate_func=there_and_back, run_time=0.2)
        
        self.wait(1)
    
    def create_feature(self, text):
        """Crée une feature"""
        bg = RoundedRectangle(
            width=4, height=0.5,
            corner_radius=0.1,
            fill_color=COLOR_PRIMARY_DARK,
            fill_opacity=0.5,
            stroke_width=0
        )
        label = Text(text, font=self.font, font_size=16, color=COLOR_WHITE)
        label.move_to(bg)
        return VGroup(bg, label)


# === VERSION COURTE ===
class GhostMeterShort(Scene):
    """Version courte ~15 secondes"""
    
    def construct(self):
        font = "Arial"
        
        # Logo + Titre
        ghost = Text("G", font=font, font_size=120, color=COLOR_PRIMARY)
        title = Text("GhostMeter", font=font, font_size=50, color=COLOR_WHITE)
        title.next_to(ghost, DOWN, buff=0.3)
        
        self.play(FadeIn(ghost), FadeIn(title))
        self.wait(0.5)
        
        # Score
        self.play(FadeOut(ghost, title))
        
        score_label = Text("Score de Ghosting", font=font, font_size=30, color=COLOR_GRAY)
        score_label.to_edge(UP, buff=1)
        
        score = Text("0%", font=font, font_size=100, color=COLOR_ALERT)
        score.next_to(score_label, DOWN, buff=0.3)
        
        self.play(FadeIn(score_label))
        self.play(FadeIn(score))
        
        # Animer le score
        for i in range(0, 86, 10):
            new_score = Text(f"{i}%", font=font, font_size=100, color=COLOR_ALERT)
            new_score.move_to(score.get_center())
            self.remove(score)
            self.add(new_score)
            score = new_score
            self.wait(0.05)
        
        final = Text("85%", font=font, font_size=100, color=COLOR_ALERT)
        final.move_to(score.get_center())
        self.remove(score)
        self.add(final)
        
        tip = Text("Il te ghost !", font=font, font_size=28, color=COLOR_TIP)
        tip.next_to(final, DOWN, buff=0.5)
        self.play(FadeIn(tip))
        self.wait(0.5)
        
        # CTA
        self.play(FadeOut(*self.mobjects))
        
        cta = Text("Telecharge GhostMeter", font=font, font_size=36, color=COLOR_PRIMARY)
        self.play(FadeIn(cta))
        self.wait(0.8)