import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import statesData from "../../states.json"
import districtsData from "../../districts.json"

const userSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(50, "Name is large")
    .regex(/^[A-Za-z.\s]+$/, "Only charecters are allowed"),
  
  address: z.string()
  .min(1, 'Address is required')
  .max(500, 'Address is too long'),
  
  state: z.string().min(1, 'Please select a state'),
})

type NameFormData = z.infer<typeof userSchema>

interface PostalApi {
  Status: string;
  PostOffice: Array<{
    District: string;
    State: string;
  }>;
}

function Register() {
  const { register, formState: { errors }, reset: resetName, handleSubmit, setValue, trigger } = useForm<NameFormData>({
    resolver: zodResolver(userSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      address: "",
      state: ""
    }
  })

  const [employeeId, setEmployeeId] = useState<string>("")
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")
  const [pincode, setPincode] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState<boolean>(false)

  const districts = selectedState ? districtsData[selectedState as keyof typeof districtsData] || [] : []

  const handleStateChange = (value: string) => {
    setSelectedState(value)
    setSelectedDistrict("")
    setValue("state", value)
    trigger("state")
  }

  const handleClear = () => {
    resetName()
    setEmployeeId("")
    setSelectedState("")
    setSelectedDistrict("")
    setPincode("")
    setShowSuccess(false)
  }

  const onSubmit = (data: NameFormData) => {
    const formData = {
      name: data.name,
      employeeId,
      address: data.address,
      state: data.state,
      district: selectedDistrict,
      pincode,
      timestamp: new Date().toISOString()
    }

    const existingData = localStorage.getItem('employeeRegistrations')
    const registrations = existingData ? JSON.parse(existingData) : []
    
    registrations.push(formData)
    
    localStorage.setItem('employeeRegistrations', JSON.stringify(registrations))
    
    setShowSuccess(true)
    
    setTimeout(() => {
      handleClear()
    }, 200000)
  }

  useEffect(() => {
    if (pincode?.length !== 6) {
      return
    }
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then((res) => res.json())
      .then((data: PostalApi[]) => {
        const [response] = data
        if (response.Status === "Success") {
          const { District, State } = response.PostOffice[0]
          setSelectedState(State)
          setTimeout(() => {
            const districts = (districtsData as Record<string, string[]>)[State] || []
            const match = districts.find(d => d.toLowerCase() === District.toLowerCase() || d.toLowerCase().includes(District.toLowerCase()) || District.toLowerCase().includes(d.toLowerCase()))
            setSelectedDistrict(match || District)
          }, 500)
        }
      })
      .catch((err) => {
        console.error("Error fetching data from Postal API:", err)
      })
  }, [pincode])

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccess(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <img src="/tick-mark.png" alt="" />
              </div>
              <p className="text-gray-600">Employee registered successfully.</p>
              <Button 
                onClick={() => setShowSuccess(false)} 
                className="mt-4 bg-chart-3 hover:bg-chart-3"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form
          className="w-[360px] bg-card text-card-foreground shadow-lg rounded-lg p-8 space-y-6 border border-border"
          onSubmit={handleSubmit(onSubmit)}
        >
        <h1 className="flex justify-center text-xl sm:text-3xl font-semi-bold tracking-tight text-foreground mb-6">
          Employee Register
        </h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
            Employee Name
            <Input
              {...register("name")}
              type="text"
              placeholder="Name"
            />
            {errors.name && <span className="text-red-500 text-xs min-h-[1rem]">{errors.name.message || '\u00A0'}</span>}
          </Label>


          <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
            Employee Id
            <Input
              type="text"
              placeholder="Id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </Label>

        </div>
        <div className="">
          <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
            Address
          </Label>
          <Textarea
            placeholder="Enter Address"
            className="break-words"
            {...register("address")}
          />
          {errors.address && <span className="text-red-500 text-xs min-h-[1rem]">{errors.address.message || '\u00A0'}</span>}
        </div>
        <div className="">
          <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
            State
          </Label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {statesData.states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <span className="text-red-500 text-xs min-h-[1rem]">{errors.state.message || '\u00A0'}</span>}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground flex-1">
            Employee District
            <Select
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
              disabled={!selectedState}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedState ? "Select District" : "Select State First"} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground flex-1">
            Pincode
            <Input
              type="text"
              placeholder=""
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              maxLength={6}
            />
          </Label>

        </div>
        <div className="flex justify-center gap-4">
          <Button type="submit" className="bg-chart-2">Submit</Button>
          <Button type="button" className="bg-destructive" onClick={handleClear}>Clear</Button>
        </div>
      </form>
    </div>
    </>
  );
}

export default Register;
