"""Tests for recommendation_engine C7 model-based emissions calculation."""

import pytest
from app.models.schemas import EmissionsMethod, EmissionsEstimated
from recommendation_engine.emissions import calculate_estimated_emissions, EMISSION_FACTORS

def test_1_train_factor():
    res = calculate_estimated_emissions(100.0, "train")
    assert res.emission_factor == 0.03
    assert res.co2e_kg == 3.0

def test_2_bus_factor():
    res = calculate_estimated_emissions(100.0, "bus")
    assert res.emission_factor == 0.05
    assert res.co2e_kg == 5.0

def test_3_solo_car_factor():
    res = calculate_estimated_emissions(100.0, "solo car")
    assert res.emission_factor == 0.17
    assert res.co2e_kg == 17.0
    
def test_4_car_alias_factor():
    res = calculate_estimated_emissions(100.0, "car")
    assert res.emission_factor == 0.17
    
def test_5_domestic_flight_factor():
    res = calculate_estimated_emissions(100.0, "domestic flight")
    assert res.emission_factor == 0.15
    assert res.co2e_kg == 15.0

def test_6_flight_alias_factor():
    res = calculate_estimated_emissions(100.0, "flight")
    assert res.emission_factor == 0.15

def test_7_decimal_distance():
    res = calculate_estimated_emissions(150.5, "train")
    assert res.distance_km == 150.5
    assert res.co2e_kg == 150.5 * 0.03

def test_8_zero_distance():
    res = calculate_estimated_emissions(0.0, "bus")
    assert res.co2e_kg == 0.0
    assert res.distance_km == 0.0

def test_9_unsupported_mode():
    with pytest.raises(ValueError, match="Unsupported transport mode"):
        calculate_estimated_emissions(100.0, "spaceship")

def test_10_negative_distance():
    with pytest.raises(ValueError, match="Distance cannot be negative"):
        calculate_estimated_emissions(-10.0, "train")

def test_11_correct_method_enum():
    res = calculate_estimated_emissions(100.0, "train")
    assert res.method == EmissionsMethod.estimated

def test_12_estimated_result_contains_required_fields():
    res = calculate_estimated_emissions(100.0, "train")
    assert hasattr(res, "distance_km")
    assert hasattr(res, "emission_factor")
    assert hasattr(res, "co2e_kg")
    
def test_13_estimated_result_does_not_contain_benchmark_fields():
    res = calculate_estimated_emissions(100.0, "train")
    assert not hasattr(res, "benchmark_kg")
    assert not hasattr(res, "reduction_pct")

def test_14_factors_from_canonical_mapping():
    assert EMISSION_FACTORS["train"] == 0.03
    assert EMISSION_FACTORS["bus"] == 0.05

def test_15_no_mutation_of_input_data():
    distance = 100.0
    mode = "train"
    calculate_estimated_emissions(distance, mode)
    assert distance == 100.0
    assert mode == "train"
