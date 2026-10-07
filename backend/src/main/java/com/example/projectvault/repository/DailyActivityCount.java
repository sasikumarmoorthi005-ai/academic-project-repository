package com.example.projectvault.repository;

import java.time.LocalDate;

public interface DailyActivityCount {
    LocalDate getActivityDate();
    String getActivityType();
    long getEventCount();
}
