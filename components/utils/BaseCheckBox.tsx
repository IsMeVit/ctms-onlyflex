import React from "react";

interface BaseCheckBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isRequired?: boolean;
  error?: string;
}


const BaseCheckBox = React.forwardRef<HTMLInputElement, BaseCheckBoxProps>(
  ({ label, isRequired, error, className = "", ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked ?? props.defaultChecked ?? false);

    // Keep checked state in sync if controlled
    React.useEffect(() => {
      if (typeof props.checked === 'boolean') setChecked(props.checked);
    }, [props.checked]);

    return (
      <div className="flex flex-col gap-1">
        <label className="inline-flex items-center cursor-pointer select-none text-zinc-200 font-semibold">
          <span className="relative mr-2">
            <input
              ref={ref}
              type="checkbox"
              className="appearance-none w-5 h-5 rounded-full border border-zinc-700 bg-zinc-950 checked:bg-red-500 checked:border-red-500"
              checked={checked}
              onChange={e => {
                setChecked(e.target.checked);
                props.onChange?.(e);
              }}
              {...props}
            />
            {checked && (
              <svg
                className="absolute left-0 top-0 w-5 h-5 pointer-events-none"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 10.5L9 13.5L14 7.5"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="ml-1">
            {label}
            {isRequired && <span className="text-red-500 mx-1">*</span>}
          </span>
        </label>
        {error && (
          <span className="text-sm text-red-500 mt-1 block">{error}</span>
        )}
      </div>
    );
  }
);

BaseCheckBox.displayName = "BaseCheckBox";

export default BaseCheckBox;
