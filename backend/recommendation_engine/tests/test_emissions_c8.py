"""Tests for recommendation_engine C8 emissions benchmark comparison."""

import pytest
from app.models.schemas import EmissionsMethod, EmissionsRouteBenchmark
from recommendation_engine.emissions import calculate_benchmark_emissions

def test_c8_1_standard_reduction():
    # option 87, benchmark 100 -> 13%
    res = calculate_benchmark_emissions(87.0, 100.0)
    assert res.co2e_kg == 87.0
    assert res.benchmark_kg == 100.0
    assert res.reduction_pct == 13.0

def test_c8_2_equal_option_benchmark():
    # equal option/benchmark -> 0%
    res = calculate_benchmark_emissions(100.0, 100.0)
    assert res.reduction_pct == 0.0

def test_c8_3_option_lower_than_benchmark():
    # option lower than benchmark -> positive reduction
    res = calculate_benchmark_emissions(50.0, 100.0)
    assert res.reduction_pct == 50.0

def test_c8_4_option_higher_than_benchmark():
    # option higher than benchmark -> negative reduction
    res = calculate_benchmark_emissions(150.0, 100.0)
    assert res.reduction_pct == -50.0

def test_c8_5_decimal_inputs():
    res = calculate_benchmark_emissions(33.3, 100.1)
    # (100.1 - 33.3) / 100.1 = 66.8 / 100.1 = 0.66733... -> 66.733...
    assert res.co2e_kg == 33.3
    assert res.benchmark_kg == 100.1
    assert abs(res.reduction_pct - 66.73326673326674) < 1e-7

def test_c8_6_very_small_valid_benchmark():
    res = calculate_benchmark_emissions(0.001, 0.002)
    assert res.reduction_pct == 50.0

def test_c8_7_zero_benchmark_rejected():
    with pytest.raises(ValueError, match="Benchmark emissions must be strictly positive"):
        calculate_benchmark_emissions(10.0, 0.0)

def test_c8_8_negative_benchmark_rejected():
    with pytest.raises(ValueError, match="Benchmark emissions must be strictly positive"):
        calculate_benchmark_emissions(10.0, -10.0)

def test_c8_9_negative_option_rejected():
    with pytest.raises(ValueError, match="Option emissions cannot be negative"):
        calculate_benchmark_emissions(-5.0, 100.0)

def test_c8_10_exact_method_is_route_benchmark():
    res = calculate_benchmark_emissions(50.0, 100.0)
    assert res.method == EmissionsMethod.route_benchmark

def test_c8_11_returned_benchmark_and_co2e_are_preserved():
    res = calculate_benchmark_emissions(42.5, 99.9)
    assert res.co2e_kg == 42.5
    assert res.benchmark_kg == 99.9

def test_c8_12_no_estimated_fields_inserted():
    res = calculate_benchmark_emissions(50.0, 100.0)
    assert not hasattr(res, "distance_km")
    assert not hasattr(res, "emission_factor")

def test_c8_13_no_mutation_of_inputs():
    opt = 50.0
    bmk = 100.0
    calculate_benchmark_emissions(opt, bmk)
    assert opt == 50.0
    assert bmk == 100.0
