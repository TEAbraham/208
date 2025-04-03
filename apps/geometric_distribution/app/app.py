# app.py

from shiny import App, ui, reactive, render
from shinywidgets import output_widget, render_widget
import plotly.graph_objects as go
import numpy as np
from scipy.stats import geom

# UI Definition
app_ui = ui.page_fluid(
    ui.panel_title("The Geometric Distribution"),
    ui.navset_tab(
        ui.nav_panel("Explore Distribution",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_slider("p_slider", "Probability of Success (p)", min=0.01, max=0.99, value=0.5, step=0.01),
                    width=500
                ),
                    ui.tags.p("The geometric distribution models the number of trials until the first success. The shape is heavily influenced by the probability of success p."),
                    output_widget("dist_plot", height="500px"),
                    ui.tags.h4("Probability Table:"),
                    ui.output_ui("prob_table")
            )
        ),
        ui.nav_panel("Find Probability",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_numeric("prob_p", "Probability of Success (p)", value=0.5, min=0.01, max=0.99, step=0.01),
                    ui.input_select("prob_type", "Type of Probability", choices=[
                        "Geometric Probability: P(X = x)",
                        "Lower Tail: P(X < x)",
                        "Upper Tail: P(X > x)",
                        "Interval: P(x₁ < X < x₂)"
                    ]),
                    ui.panel_conditional(
                        "!input.prob_type.includes('Interval')",
                        ui.input_numeric("x1_prob", "Value of x:", value=5, step=1)
                    ),
                    ui.panel_conditional(
                        "input.prob_type.includes('Interval')",
                        ui.input_numeric("x1_prob", "x₁:", value=5, step=1),
                        ui.input_numeric("x2_prob", "x₂:", value=7, step=1)
                ),
                    width=500),
                    output_widget("prob_plot", height="500px"),
                    ui.output_ui("prob_summary")
            )
        ),
        ui.nav_panel("Find Percentile",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_numeric("perc_p", "Probability of Success (p)", value=0.5, min=0.01, max=0.99, step=0.01),
                    ui.input_select("perc_type", "Type of Percentile", choices=[
                        "Lower Tail: P(X < x)",
                        "Upper Tail: P(X > x)",
                        "Middle Interval: P(x₁ < X < x₂)"
                    ]),
                    ui.input_numeric("perc_prob", "Probability (%)", value=95, min=0, max=100, step=0.1),
                    width=500),
                    output_widget("perc_plot", height="500px"),
                    ui.output_ui("perc_summary")
            )
        )
    )
)

# Server Logic
def server(input, output, session):

    @output
    @render_widget
    def dist_plot():
        p = input.p_slider()
        x = np.arange(1, 20)
        y = geom.pmf(x, p)

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=x,
            y=y,
            marker_color="#FF9B3C",
            hovertemplate="x = %{x}<br>P(X = %{x}) = %{y:.4f}<extra></extra>",
        ))

        fig.update_layout(
            title=f"Geometric Distribution (p={p})",
            xaxis_title="x",
            yaxis_title="P(X = x)",
            margin=dict(l=40, r=40, t=40, b=40)
        )
        return fig

    @output
    @render.ui
    def prob_table():
        p = input.p_slider()
        x_vals = np.arange(1, 20)
        probs = geom.pmf(x_vals, p)

        rows = "\n".join(
            f"<tr><td align='center'>{x}</td><td align='center'>{prob:.5f}</td></tr>"
            for x, prob in zip(x_vals, probs)
        )

        html = f"""
        <table class='table shiny-table table-hover spacing-s' style='width:auto;'>
        <thead>
            <tr>
                <th style='text-align: center;'>x</th>
                <th style='text-align: center;'>P(X = x)</th>
            </tr>
        </thead>
        <tbody>{rows}</tbody>
        </table>
        """
        return ui.HTML(html)

    @output
    @render_widget
    def prob_plot():
        p = input.prob_p()
        x = np.arange(1, 20)
        y = geom.pmf(x, p)

        x1 = input.x1_prob()
        x2 = input.x2_prob() if hasattr(input, 'x2_prob') else None
        prob_type = input.prob_type()

        fig = go.Figure()
        fig.add_trace(go.Bar(x=x, y=y, marker_color="#eee"))

        highlight = np.zeros_like(y)
        if "Geometric Probability" in prob_type:
            if 1 <= x1 <= 20:
                highlight[int(x1)] = y[int(x1)]
        elif "Lower" in prob_type:
            mask = x < x1
            highlight[mask] = y[mask]
        elif "Upper" in prob_type:
            mask = x > x1
            highlight[mask] = y[mask]
        elif "Interval" in prob_type:
            mask = (x > x1) & (x < x2)
            highlight[mask] = y[mask]

        fig.add_trace(go.Bar(
            x=x,
            y=highlight,
            marker_color="#FF9B3C",
            name="Highlighted"
        ))

        fig.update_layout(
            title="Geometric Probability Visualization",
            xaxis_title="x",
            yaxis_title="P(X = x)",
            showlegend=False
        )
        return fig

    @output
    @render.ui
    def prob_summary():
        p = input.prob_p()
        x1 = input.x1_prob()
        x2 = input.x2_prob() if hasattr(input, 'x2_prob') else None
        prob_type = input.prob_type()

        if "Geometric Probability" in prob_type:
            result = geom.pmf(x1, p)
            msg = f"P(X = {x1}) = {result:.4f}"
        elif "Lower" in prob_type:
            result = geom.cdf(x1 - 1, p)
            msg = f"P(X < {x1}) = {result:.4f}"
        elif "Upper" in prob_type:
            result = 1 - geom.cdf(x1, p)
            msg = f"P(X > {x1}) = {result:.4f}"
        elif "Interval" in prob_type:
            result = geom.cdf(x2 - 1, p) - geom.cdf(x1, p)
            msg = f"P({x1} < X < {x2}) = {result:.4f}"
        else:
            msg = "Invalid selection."

        return ui.tags.p(msg)

    @output
    @render_widget
    def perc_plot():
        p = input.perc_p()
        prob = input.perc_prob() / 100
        perc_type = input.perc_type()

        x = np.arange(1, 20)
        y = geom.pmf(x, p)

        fig = go.Figure()
        fig.add_trace(go.Bar(x=x, y=y, marker_color="#eee"))

        if "Lower" in perc_type:
            x_val = np.argmax(geom.cdf(x, p) >= prob)
            bar_colors = ["#FF9B3C" if i <= x_val else "#eee" for i in range(len(x))]
        elif "Upper" in perc_type:
            x_val = np.argmax(geom.cdf(x, p) >= 1 - prob)
            bar_colors = ["#FF9B3C" if i >= x_val else "#eee" for i in range(len(x))]
        elif "Middle" in perc_type:
            low_tail = (1 - prob) / 2
            low_x = np.argmax(geom.cdf(x, p) >= low_tail)
            high_x = np.argmax(geom.cdf(x, p) >= 1 - low_tail)
            bar_colors = ["#FF9B3C" if low_x <= i <= high_x else "#eee" for i in range(len(x))]
        else:
            bar_colors = ["#eee"] * len(x)

        fig.data[0].marker.color = bar_colors
        fig.update_layout(
            title="Percentile Range Highlight",
            xaxis_title="x",
            yaxis_title="P(X = x)",
            showlegend=False
        )
        return fig

    @output
    @render.ui
    def perc_summary():
        p = input.perc_p()
        prob = input.perc_prob() / 100
        perc_type = input.perc_type()
        x = np.arange(1, 20)

        if "Lower" in perc_type:
            val = np.argmax(geom.cdf(x, p) >= prob) + 1
            msg = f"x such that P(X < x) ≈ {prob:.2%} is x = {val}"
        elif "Upper" in perc_type:
            val = np.argmax(geom.cdf(x, p) >= 1 - prob) + 1
            msg = f"x such that P(X > x) ≈ {prob:.2%} is x = {val}"
        elif "Middle" in perc_type:
            low_tail = (1 - prob) / 2
            low = np.argmax(geom.cdf(x, p) >= low_tail) + 1
            high = np.argmax(geom.cdf(x, p) >= 1 - low_tail) + 1
            msg = f"x values such that P(x₁ < X < x₂) ≈ {prob:.2%} are x ∈ [{low}, {high}]"
        else:
            msg = "Invalid input."

        return ui.tags.p(msg)


app = App(app_ui, server)
