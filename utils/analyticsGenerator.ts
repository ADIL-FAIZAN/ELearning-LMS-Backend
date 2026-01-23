import type { Document,Model } from "mongoose";

interface MonthData {

    month: string,
    count: number

}
                                                    //
export async function generateLast12MonthsData<T extends Document>(model: Model<T>): Promise<{last12Months: MonthData[]}>{

    const last12Months: MonthData[] = [];//
    const currentDate = new Date();

    currentDate.setDate(currentDate.getDate() + 1); // getDate() only current date deta hai like ->25

 for (let i = 11; i >= 0; i--) {
 
 const endDate = new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate() - i * 28);
 const startDate = new Date(endDate.getFullYear(),endDate.getMonth(),endDate.getDate() - 28);  // end date sai 28 din peeche  

 const monthYear = endDate.toLocaleString('default',{day:"numeric",month:"short",year:"numeric"});    //yei human friendly name bnata hai   
 const count = await model.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }); // database mai jitne records create huwe hai specific model k between start and end date unka count return kre ga
      
 last12Months.push({month:monthYear,count});    
        
    };


    return { last12Months };

};