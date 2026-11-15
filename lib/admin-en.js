// অ্যাডমিন ড্যাশবোর্ডের বাংলা → English অনুবাদ। কী = কোডে লেখা বাংলা লেখা, মান = ইংরেজি।
// প্রতিটি পেজের অনুবাদ lib/admin-en/ ফোল্ডারে আলাদা ফাইলে; নতুন ফাইল বানালে এখানে যোগ করুন।
import common from "./admin-en/common";
import dashboard from "./admin-en/dashboard";
import people from "./admin-en/people";
import money from "./admin-en/money";
import misc from "./admin-en/misc";

export const adminEn = { ...common, ...dashboard, ...people, ...money, ...misc };
