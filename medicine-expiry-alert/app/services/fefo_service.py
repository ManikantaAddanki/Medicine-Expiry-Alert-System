from datetime import date
from typing import List, Dict, Any, Optional
from app.core.enums import BatchStatus

def calculate_fefo_allocation(
    batches: List[Any],
    requested_units: int,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Implements First Expiry, First Out (FEFO) allocation.
    
    Excludes batches that are:
    - Non-active (QUARANTINED, RECALLED, DEPLETED, EXPIRED)
    - Past their expiry date (expiry_date <= reference_date)
    - Zero or negative quantity
    
    Sorts strictly by earliest expiry_date first.
    Returns:
    - allocated_batches: List of {batch_id, batch_number, expiry_date, allocated_units, available_units}
    - total_allocated: Total units fulfilled
    - unfulfilled_units: Remaining units if stock was insufficient
    - is_fully_fulfilled: Boolean
    - excluded_batches_count: Number of batches disqualified due to expiry/quarantine
    """
    ref_date = reference_date or date.today()
    
    eligible: List[Any] = []
    excluded_count = 0
    
    for b in batches:
        # Strict exclusion rules
        if getattr(b, "available_quantity", 0) <= 0:
            continue
        status = getattr(b, "status", BatchStatus.ACTIVE)
        if status != BatchStatus.ACTIVE:
            excluded_count += 1
            continue
        if b.expiry_date <= ref_date:
            excluded_count += 1
            continue
        eligible.append(b)
        
    # Sort by earliest expiry date first
    eligible.sort(key=lambda b: (b.expiry_date, b.batch_number))
    
    allocations = []
    remaining_needed = requested_units
    
    for b in eligible:
        if remaining_needed <= 0:
            break
            
        avail = getattr(b, "available_quantity", 0)
        take = min(avail, remaining_needed)
        allocations.append({
            "batch_id": getattr(b, "id", None),
            "batch_number": b.batch_number,
            "expiry_date": str(b.expiry_date),
            "allocated_units": take,
            "available_units": avail,
            "storage_location": getattr(b, "storage_location", "Main Rack"),
        })
        remaining_needed -= take
        
    total_allocated = requested_units - remaining_needed
    
    return {
        "requested_units": requested_units,
        "total_allocated": total_allocated,
        "unfulfilled_units": remaining_needed,
        "is_fully_fulfilled": remaining_needed == 0,
        "allocations": allocations,
        "eligible_batches_count": len(eligible),
        "excluded_batches_count": excluded_count
    }
