# app.py

from shiny import App, ui
from shinywidgets import output_widget, render_widget
import plotly.graph_objects as go
import numpy as np

# Define the UI
app_ui = ui.page_fluid(
    ui.panel_title("Interactive Normal Distribution"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_slider("mean", "Mean (μ)", min=-10, max=10, value=0, step=0.1),
            ui.input_slider("std", "Standard Deviation (σ)", min=0.1, max=5, value=1, step=0.1)
        ),

        output_widget("dist_plot")

    )
)

# Define the server logic
def server(input, output, session):
    @output
    @render_widget
    def dist_plot():
        x = np.linspace(-20, 20, 500)
        y = (1 / (input.std() * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - input.mean()) / input.std()) ** 2)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x, y=y, mode='lines', name='Normal Distribution'))
        fig.update_layout(
            xaxis_title="X",
            yaxis_title="Density",
            title=f"Normal Distribution (μ={input.mean()}, σ={input.std()})",
            margin=dict(l=20, r=20, t=40, b=20)
        )
        return fig

# Create the app
app = App(app_ui, server)
