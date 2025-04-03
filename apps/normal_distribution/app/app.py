# app.py

from shiny import App, ui, reactive, render
from shinywidgets import output_widget, render_widget
import plotly.graph_objects as go
import numpy as np
import pandas as pd
from scipy.stats import norm

app_ui = ui.page_fluid(
    ui.panel_title("The Normal Distribution"),
    ui.navset_tab(
        ui.nav_panel("Explore Distribution",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_slider("mu_slider", "Mean (μ)", min=-10, max=10, value=0, step=0.1),
                    ui.input_slider("sigma_slider", "Standard Deviation (σ)", min=0.1, max=5, value=1, step=0.1),
                    ui.input_checkbox("use_inputs", "Enter numbers for μ and σ", value=False),
                    ui.panel_conditional(
                        "input.use_inputs",
                        ui.input_numeric("mu_text", "μ", value=0, step=0.1),
                        ui.input_numeric("sigma_text", "σ", value=1, min=0.1, step=0.1)
                    ),
                    width=400
                ),
                    ui.tags.p("The normal distribution is a bell-shaped distribution. Its location and spread are determined by the two parameters μ (the mean) and σ (the standard deviation).  Explore how the location and shape of the normal distribution depends on these two parameters by using the sliders below."),
                    output_widget("dist_plot", height="400px"),
                    ui.tags.p("The blue shaded areas show that 68% of a normal distribution falls within one standard deviation of the mean, i.e., between μ - σ and μ + σ (darkest shade), 95% fall within two standard deviations μ ± 2σ, and 99.7% fall within three standard deviations μ ± 3σ (lightest shade)."),
                    ui.output_ui("interval_table")
            )
        ),
        ui.nav_panel("Find Probability",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_numeric("mu_prob", "Mean (μ):", value=0),
                    ui.input_numeric("sigma_prob", "Standard Deviation (σ):", value=1),
                    ui.input_select("prob_type", "Type of Probability", choices=[
                        "Lower Tail: P(X < x)",
                        "Upper Tail: P(X > x)",
                        "Interval: P(x₁ < X < x₂)",
                        "Two-Tail: P(X < x₁) + P(X > x₂)"
                    ]),
                    ui.panel_conditional(
                        "!input.prob_type.includes('Interval') && !input.prob_type.includes('Two-Tail')",
                        ui.input_numeric("x1_prob", "Value of x:", value=-1.96)
                    ),
                    ui.panel_conditional(
                        "input.prob_type.includes('Interval') || input.prob_type.includes('Two-Tail')",
                        ui.input_numeric("x1_prob", "x₁:", value=-1.96),
                        ui.input_numeric("x2_prob", "x₂:", value=1.96)
                    ),
                    width=400
                ),
                    output_widget("prob_plot", height="400px"),
                    ui.output_ui("prob_table")
            )
        ),
        ui.nav_panel("Find Percentile",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_numeric("mu_perc", "Mean (μ):", value=0),
                    ui.input_numeric("sigma_perc", "Standard Deviation (σ):", value=1),
                    ui.input_select("perc_type", "Type of Percentile", choices=[
                        "Lower Tail: P(X < x)",
                        "Upper Tail: P(X > x)",
                        "Center: P(x₁ < X < x₂)",
                    ]),
                    ui.input_text("x_value_perc", "Probability (in %):", value=95),
                    width=400
                ),
                    output_widget("perc_plot", height="400px"),
                    ui.output_ui("perc_table")
            )
        )
    )
)

def server(input, output, session):
    @output
    @render_widget
    def dist_plot():
        mu = input.mu_text() if input.use_inputs() else input.mu_slider()
        sigma = input.sigma_text() if input.use_inputs() else input.sigma_slider()
        x = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 1000)
        y = norm.pdf(x, mu, sigma)

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x, y=y, mode='lines', name='Normal Curve', line=dict(color='black')))

        for z, color, label in reversed(list(zip([1, 2, 3], ['#2c7fb8', '#74a9cf', '#d0d1e6'], ['68%', '95%', '99.7%']))):
            x_fill = np.linspace(mu - z * sigma, mu + z * sigma, 400)
            y_fill = norm.pdf(x_fill, mu, sigma)
            fig.add_trace(go.Scatter(
                x=np.concatenate(([x_fill[0]], x_fill, [x_fill[-1]])),
                y=np.concatenate(([0], y_fill, [0])),
                fill='toself',
                fillcolor=color,
                line=dict(color='rgba(0,0,0,0)'),
                name=label))

        fig.update_layout(
            title=f"Normal Distribution (μ={mu}, σ={sigma})",
            xaxis_title="X",
            yaxis_title="Density",
            margin=dict(l=20, r=20, t=40, b=20)
        )
        return fig

    @output
    @render.ui
    def interval_table():
        mu = input.mu_text() if input.use_inputs() else input.mu_slider()
        sigma = input.sigma_text() if input.use_inputs() else input.sigma_slider()
        row1 = f"<tr> <td align='center'> Interval: </td> <td align='center'> [{mu - sigma:.1f}, {mu + sigma:.1f}] </td> <td align='center'> [{mu - 2*sigma:.1f}, {mu + 2*sigma:.1f}] </td> <td align='center'> [{mu - 3*sigma:.1f}, {mu + 3*sigma:.1f}] </td> </tr>"
        row2 = "<tr> <td align='center'> Percent: </td> <td align='center'> 68% </td> <td align='center'> 95% </td> <td align='center'> 99.7% </td> </tr>"
        html = f"""
        <table class='table shiny-table table-hover spacing-s' style='width:auto;'>
        <thead> <tr> <th align='center'> μ = {mu}, σ = {sigma} </th> <th align='center'> μ ± σ </th> <th align='center'> μ ± 2σ </th> <th align='center'> μ ± 3σ </th>  </tr> </thead>
        <tbody>{row1}{row2}</tbody>
        </table>
        """
        return ui.HTML(html)

    @output
    @render_widget
    def prob_plot():
        mu = input.mu_prob()
        sigma = input.sigma_prob()
        prob_type = input.prob_type()

        x_range = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 1000)
        y_range = norm.pdf(x_range, mu, sigma)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x_range, y=y_range, mode='lines', name='Normal Curve'))

        x1 = input.x1_prob()
        x2 = input.x2_prob() if hasattr(input, 'x2_prob') else None

        prob = 'NA'

        if 'Lower' in prob_type:
            mask = x_range < x1
            mask_2 = None
            prob = norm.cdf(x1, mu, sigma)
        elif 'Upper' in prob_type:
            mask = x_range > x1
            mask_2 = None
            prob = 1 - norm.cdf(x1, mu, sigma)
        elif 'Interval' in prob_type and x2 is not None:
            mask = (x_range > x1) & (x_range < x2)
            mask_2 = None
            prob = norm.cdf(x2, mu, sigma) - norm.cdf(x1, mu, sigma)
        elif 'Two-Tail' in prob_type and x2 is not None:
            x_low, x_high = sorted([x1, x2])
            mask = x_range < x_low
            mask_2 = x_range > x_high
            prob = norm.cdf(x1, mu, sigma)
            prob_2 = (1 - norm.cdf(x2, mu, sigma))
        else:
            mask = np.full_like(x_range, False, dtype=bool)
            mask_2 = None

        x_fill = x_range[mask]
        x_fill_2 = x_range[mask_2]
        y_fill = norm.pdf(x_fill, mu, sigma)
        y_fill_2 = norm.pdf(x_fill_2, mu, sigma)

        if mask_2 is not None:
            fig.add_trace(go.Scatter(
                x=np.concatenate([[x_fill_2[0]], x_fill_2, [x_fill_2[-1]]]),
                y=np.concatenate([[0], y_fill_2, [0]]),
                fill='toself', fillcolor='#64bdff', line=dict(color='rgba(0,0,0,0)'),
                name=f'P = {prob_2:.4f}' if isinstance(prob_2, float) else 'Shaded Area'))

        fig.add_trace(go.Scatter(
                x=np.concatenate([[x_fill[0]], x_fill, [x_fill[-1]]]),
                y=np.concatenate([[0], y_fill, [0]]),
                fill='toself', fillcolor='#64bdff', line=dict(color='rgba(0,0,0,0)'),
                name=f'P = {prob:.4f}' if isinstance(prob, float) else 'Shaded Area'))

        fig.update_layout(
            title=f"Normal Distribution: {prob_type}",
            xaxis_title="X",
            yaxis_title="Density",
            margin=dict(l=20, r=20, t=40, b=20)
        )
        return fig

    @output
    @render.ui
    def prob_table():
        mu = input.mu_prob()
        sigma = input.sigma_prob()
        prob_type = input.prob_type()
        x1 = input.x1_prob()
        x2 = input.x2_prob() if hasattr(input, 'x2_prob') else None

        if 'Lower' in prob_type:
            prob = norm.cdf(x1, mu, sigma)
            z = (x1 - mu) / sigma
            prob_str = f"P(X < {x1})"
        elif 'Upper' in prob_type:
            prob = 1 - norm.cdf(x1, mu, sigma)
            z = (x1 - mu) / sigma
            prob_str = f"P(X > {x1})"
        elif 'Interval' in prob_type and x2 is not None:
            prob = norm.cdf(x2, mu, sigma) - norm.cdf(x1, mu, sigma)
            z = f"{(x1 - mu) / sigma:.2f}, {(x2 - mu) / sigma:.2f}"
            prob_str = f"P({x1} < X < {x2})"
        elif 'Two-Tail' in prob_type and x2 is not None:
            prob = norm.cdf(x1, mu, sigma) + (1 - norm.cdf(x2, mu, sigma))
            z = f"{(x1 - mu) / sigma:.2f}, {(x2 - mu) / sigma:.2f}"
            prob_str = f"P(X < {x1}) + P(X > {x2})"
        else:
            prob = 'NA'
            z = 'NA'
            prob_str = "Invalid Input"

        html = f"""
        <table class='table shiny-table table-hover spacing-s' style='width:auto;'>
        <thead>
        <tr>
            <th style='text-align: center;'> Mean μ </th>
            <th style='text-align: center;'> Std. Dev. σ </th>
            <th style='text-align: center;'> Value(s) </th>
            <th style='text-align: center;'> Probability<br>{prob_str} </th>
            <th style='text-align: center;'> z-Score </th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td align='center'>{mu}</td>
            <td align='center'>{sigma}</td>
            <td align='center'>{x1 if 'Upper' in prob_type or 'Lower' in prob_type else f'{x1}, {x2}'}</td>
            <td align='center'>{prob if isinstance(prob, str) else round(prob, 4)}</td>
            <td align='center'>{z}</td>
        </tr>
        </tbody>
        </table>
        """
        return ui.HTML(html)

    @output
    @render_widget
    def perc_plot():
        mu = input.mu_perc()
        sigma = input.sigma_perc()
        perc_type = input.perc_type()

        try:
            p = float(input.x_value_perc()) / 100
        except:
            p = 0.95

        x_range = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 1000)
        y_range = norm.pdf(x_range, mu, sigma)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x_range, y=y_range, mode='lines', name='Normal Curve'))

        if 'Lower' in perc_type:
            x_val = norm.ppf(p, mu, sigma)
            mask = x_range < x_val
        elif 'Upper' in perc_type:
            x_val = norm.ppf(1 - p, mu, sigma)
            mask = x_range > x_val
        elif 'Center' in perc_type:
            x_low = norm.ppf((1 - p) / 2, mu, sigma)
            x_high = norm.ppf((1 + p) / 2, mu, sigma)
            x_low, x_high = sorted([x_low, x_high])
            mask = (x_range > x_low) & (x_range < x_high)
        else:
            mask = np.full_like(x_range, False, dtype=bool)

        x_fill = x_range[mask]
        y_fill = norm.pdf(x_fill, mu, sigma)

        if len(x_fill) > 0:
            fig.add_trace(go.Scatter(
                x=np.concatenate([[x_fill[0]], x_fill, [x_fill[-1]]]),
                y=np.concatenate([[0], y_fill, [0]]),
                fill='toself', fillcolor='#46C8B2', line=dict(color='rgba(0,0,0,0)'),
                name=f'{p*100:.1f}% Area'))

        fig.update_layout(
            title=f"Normal Distribution: {perc_type}",
            xaxis_title="X",
            yaxis_title="Density",
            margin=dict(l=20, r=20, t=40, b=20)
        )
        return fig

    @output
    @render.ui
    def perc_table():
        mu = input.mu_perc()
        sigma = input.sigma_perc()
        perc_type = input.perc_type()

        try:
            p = float(input.x_value_perc()) / 100
        except:
            p = 0.95

        if 'Lower' in perc_type:
            x = round(norm.ppf(p, mu, sigma), 4)
            z = round((x - mu) / sigma, 4)
            label = f"P(X < x) = {p:.2f}"
        elif 'Upper' in perc_type:
            x = round(norm.ppf(1 - p, mu, sigma), 4)
            z = round((x - mu) / sigma, 4)
            label = f"P(X > x) = {p:.2f}"
        elif 'Center' in perc_type:
            x1 = float(norm.ppf((1 - p) / 2, mu, sigma))
            x2 = float(norm.ppf((1 + p) / 2, mu, sigma))
            x = round(x1, 4), round(x2, 4)
            z = round((x1 - mu)/sigma, 4), round((x2 - mu)/sigma, 4)
            label = f"P(x₁ < X < x₂) = {p:.2f}"
        else:
            x = "NA"
            z = "NA"
            label = 'Invalid Input'

        html = f"""
        <table class='table shiny-table table-hover spacing-s' style='width:auto;'>
        <thead>
        <tr>
            <th style='text-align: center;'> Mean μ </th>
            <th style='text-align: center;'> Std. Dev. σ </th>
            <th style='text-align: center;'> Value(s) </th>
            <th style='text-align: center;'> Percentile<br>{label} </th>
            <th style='text-align: center;'> z-Score </th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td align='center'>{mu}</td>
            <td align='center'>{sigma}</td>
            <td align='center'>{x}</td>
            <td align='center'>{p:.4f}</td>
            <td align='center'>{z}</td>
        </tr>
        </tbody>
        </table>
        """
        return ui.HTML(html)


app = App(app_ui, server)
