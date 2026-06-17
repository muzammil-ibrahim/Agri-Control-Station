import pandas as pd
import plotly.graph_objects as go

df = pd.read_csv("path_coordinates.csv")

mapbox_token = "YOUR_MAPBOX_ACCESS_TOKEN"

fig = go.Figure()

fig.add_trace(
    go.Scattermap(
        lat=df["latitude"],
        lon=df["longitude"],
        mode="lines",
        line=dict(width=3),
        name="Path"
    )
)

fig.update_layout(
    mapbox=dict(
        accesstoken=mapbox_token,
        style="satellite-streets",   # or "satellite"
        zoom=18,
        center=dict(
            lat=df["latitude"].mean(),
            lon=df["longitude"].mean()
        )
    ),
    margin=dict(l=0, r=0, t=0, b=0)
)

fig.show()