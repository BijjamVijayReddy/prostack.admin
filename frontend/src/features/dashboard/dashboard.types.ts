export interface OverviewData {
  year: number;
  totalStudents: number;
  prevTotalStudents: number;
  newAdmissions: number;
  prevNewAdmissions: number;
  studentsPlaced: number;
  prevStudentsPlaced: number;
  feeCollectionPct: number;
  prevFeeCollectionPct: number;
  trendLabels: string[];
  trendAdmissions: number[];
  trendEnquiries: number[];
  courseEnrollment: { course: string; count: number }[];
  // Order Summary
  feeStatus: {
    total: number;
    fullyPaid: number;
    partialPaid: number;
    notPaid: number;
    fullyPaidAmt: number;
    partialPaidAmt: number;
    notPaidAmt: number;
  };
  enquiryStatus: {
    total: number;
    converted: number;
    inProgress: number;
    notConverted: number;
    allTimeActive: number;
    allTimeConverted: number;
    allTimeClosed: number;
    prevTotal: number;
    prevConverted: number;
    prevInProgress: number;
    prevNotConverted: number;
  };
  placementStatus: {
    total: number;
    placed: number;
    inProcess: number;
    notPlaced: number;
  };
}
