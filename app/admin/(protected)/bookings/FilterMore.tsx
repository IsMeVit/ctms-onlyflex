"use client";
import React from "react";
import {
  Select,
} from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
export const FilterMore = () => {
  const [cinema, setCinema] = React.useState("all"); 

  return (
    <div className="flex gap-4 mt-4">
      <CustomDropdown
        value={cinema}
        onChange={setCinema}
        options={[
          { value: "all", label: "All Cinema" },
          { value: "legen-cinema", label: "Legen Cinema" },
          { value: "legen-kmall", label: "Legen Kmall" },
          { value: "olympia", label: "Olympia ---" },
        ]}
      />

      <DatePicker value="" onChange={() => {}} placeholder="Select From Date" className="flex-1" />
      <DatePicker value="" onChange={() => {}} placeholder="Select To Date" className="flex-1" />
      {/* <TimePicker value="" onChange={() => {}} placeholder="Select Time" className="flex-1" /> */}
    </div>
  );
};
