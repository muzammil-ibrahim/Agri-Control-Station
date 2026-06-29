import pandas as pd
import plotly.graph_objects as go

df = pd.read_csv("path_coordinates.csv")

fig = go.Figure()

# Main path
fig.add_trace(
    go.Scattermap(
        lat=df["latitude"],
        lon=df["longitude"],
        mode="lines",
        line=dict(width=3),
        name="Path"
    )
)

# Add arrows every N points
step = 20

fig.add_trace(
    go.Scattermap(
        lat=df["latitude"][::step],
        lon=df["longitude"][::step],
        mode="text",
        text=[str(i) for i in range(0, len(df), step)],
        textposition="top center",
        name="Sequence"
    )
)

fig.update_layout(
    mapbox=dict(
        style="satellite",
        zoom=18,
        center=dict(
            lat=df["latitude"].mean(),
            lon=df["longitude"].mean()
        )
    ),
    margin=dict(l=0, r=0, t=0, b=0)
)

fig.show()