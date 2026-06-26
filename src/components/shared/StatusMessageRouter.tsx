"use client"
import { useState, useEffect, createContext, useContext } from "react"

type StatusMessageContextType = {
    showMessage: (
        message: string,
        isSuccess: boolean
    ) => void;
};

const StatusMessageContext =
    createContext<StatusMessageContextType | null>(
        null
    );

export function useStatusMessage() {
    const context = useContext(
        StatusMessageContext
    );

    if (!context) {
        throw new Error(
            "useStatusMessage must be used inside StatusMessageRouter"
        );
    }

    return context;
}

export default function StatusMessageRouter({ children }: { children: React.ReactNode }) {
    const [isSuccess, setIsSuccess] = useState<boolean | "IDLE">("IDLE");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (isSuccess === "IDLE") return;

        const timing = isSuccess ? 3000 : 5000;

        const timer = setTimeout(() => {
            setIsSuccess("IDLE");
            setMessage("");
        }, timing);

        return () => clearTimeout(timer);
    }, [isSuccess]);

    const showMessage = (
        message: string,
        isSuccess: boolean
    ) => {
        setMessage(message);
        setIsSuccess(isSuccess);
    };

    return (
        <StatusMessageContext.Provider value={{
            showMessage,
        }}>
            {isSuccess !== "IDLE" && (
                <div className="fixed inset-x-0 top-4 z-50 pointer-events-none">
                    <div className="mx-auto flex w-[min(1024px,calc(100%-32px))] justify-end">
                        <section
                            className={`pointer-events-auto flex items-center gap-4 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur transition-all duration-300
                        ${isSuccess
                                    ? "border-emerald-200 bg-white/95 text-emerald-800 shadow-emerald-100"
                                    : "border-rose-200 bg-white/95 text-rose-800 shadow-rose-100"
                                }`}
                        >

                            <h2 className="text-sm font-bold">
                                {message}
                            </h2>

                            <button
                                onClick={() => {
                                    setIsSuccess("IDLE");
                                    setMessage("");
                                }}
                                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
                            >
                                ✕
                            </button>

                        </section>
                    </div>
                </div>
            )}
            {children}
        </StatusMessageContext.Provider>
    )
}
