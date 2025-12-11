import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon } from 'lucide-react';
import '../index.css'; // Ensure we have access to Tailwind

interface DatePickerWrapperProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    className?: string;
    label?: string;
    showTimeSelect?: boolean;
}

const DatePickerWrapper: React.FC<DatePickerWrapperProps> = ({
    selected,
    onChange,
    placeholderText = "Select date",
    className = "",
    label,
    showTimeSelect = false
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && <label className="text-sm text-slate-400 block mb-1">{label}</label>}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <CalendarIcon size={18} className="text-slate-400" />
                </div>
                <DatePicker
                    selected={selected}
                    onChange={onChange}
                    placeholderText={placeholderText}
                    showTimeSelect={showTimeSelect}
                    dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                    wrapperClassName="w-full"
                    calendarClassName="!bg-slate-800 !border-slate-700 !text-white !font-sans !rounded-xl !shadow-xl !z-[9999]"
                    dayClassName={(_) => "hover:!bg-blue-600 !text-slate-200 hover:!text-white rounded-lg"}
                    monthClassName={() => "!bg-slate-800 !text-white"}
                    timeClassName={() => "!bg-slate-800 !text-white"}
                    portalId="datepicker-portal"
                />
            </div>
            <style>{`
                .react-datepicker__header {
                    background-color: #1e293b !important; /* slate-800 */
                    border-bottom: 1px solid #334155 !important; /* slate-700 */
                }
                .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
                    color: #f8fafc !important; /* slate-50 */
                }
                .react-datepicker__day-name {
                    color: #94a3b8 !important; /* slate-400 */
                }
                .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
                    background-color: #2563eb !important; /* blue-600 */
                    color: white !important;
                }
                .react-datepicker__time-container {
                    border-left: 1px solid #334155 !important;
                }
                .react-datepicker__time-list-item:hover {
                    background-color: #334155 !important;
                }
            `}</style>
        </div>
    );
};

export default DatePickerWrapper;
