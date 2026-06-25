export const categories = [
    "Food",
    "Transport",
    "Books",
    "School",
    "Entertainment",
    "Subscription",
    "Shopping",
    "Other",
] as const;

export type Category = (typeof categories)[number];

export const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-SG", {
        style: "currency",
        currency: "SGD",
    }).format(cents / 100);

export const formatMonth = (month: string) =>
    new Intl.DateTimeFormat("en-SG", {
        month: "long",
        year: "numeric",
    }).format(new Date(`${month}-01T12:00:00`));

export const currentMonth = () =>
    new Date()
        .toLocaleDateString("en-CA", {
            timeZone: "Asia/Singapore",
        })
        .slice(0, 7);

export const monthBounds = (month: string) => {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    return {
        start,
        end,
    };
};
