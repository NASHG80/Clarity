"""Model-based emissions calculation."""

from app.models.schemas import EmissionsEstimated, EmissionsRouteBenchmark

# Canonical emission factors (kg CO2e per km)
# Maps project representations to their canonical factor
EMISSION_FACTORS = {
    "flight": 0.15,
    "domestic flight": 0.15,
    "car": 0.17,
    "solo car": 0.17,
    "bus": 0.05,
    "train": 0.03,
}

def calculate_estimated_emissions(distance_km: float, mode: str) -> EmissionsEstimated:
    """Calculate formula-based emissions: distance_km * emission_factor.
    
    Args:
        distance_km: Distance traveled in kilometers. Must be >= 0.
        mode: The transport mode representation (e.g. "flight", "train").
        
    Returns:
        EmissionsEstimated object with method="estimated".
        
    Raises:
        ValueError: If distance is negative or mode is unsupported.
    """
    if distance_km < 0:
        raise ValueError("Distance cannot be negative")
        
    factor = EMISSION_FACTORS.get(mode.lower())
    if factor is None:
        raise ValueError(f"Unsupported transport mode for emissions: {mode}")
        
    co2e_kg = distance_km * factor
    
    return EmissionsEstimated(
        co2e_kg=co2e_kg,
        distance_km=distance_km,
        emission_factor=factor
    )

def calculate_benchmark_emissions(option_kg: float, benchmark_kg: float) -> EmissionsRouteBenchmark:
    """Compare an option's emissions against a route benchmark.
    
    Args:
        option_kg: The option's emissions in kg CO2e. Must be >= 0.
        benchmark_kg: The route's typical emissions in kg CO2e. Must be > 0.
        
    Returns:
        EmissionsRouteBenchmark object with method="route_benchmark".
        
    Raises:
        ValueError: If option_kg is negative or benchmark_kg is not strictly positive.
    """
    if option_kg < 0:
        raise ValueError("Option emissions cannot be negative")
    if benchmark_kg <= 0:
        raise ValueError("Benchmark emissions must be strictly positive")
        
    reduction_pct = ((benchmark_kg - option_kg) / benchmark_kg) * 100.0
    
    return EmissionsRouteBenchmark(
        co2e_kg=option_kg,
        benchmark_kg=benchmark_kg,
        reduction_pct=reduction_pct
    )

